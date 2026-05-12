const Booking = require('../models/Booking');
const Show = require('../models/Show');

// Helper function to save with retry on version error
const saveWithRetry = async (doc, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await doc.save();
      console.log(`✅ Save successful on attempt ${i + 1}`);
      return true;
    } catch (error) {
      if (error.name === 'VersionError') {
        console.log(`⚠️ Version conflict on attempt ${i + 1}/${retries}, refreshing document...`);
        // Refresh the document from database using findById
        const freshDoc = await Show.findById(doc._id);
        if (!freshDoc) {
          throw new Error('Document no longer exists');
        }
        // Update the original document with fresh data
        doc.temporaryHolds = freshDoc.temporaryHolds;
        doc.bookedSeats = freshDoc.bookedSeats;
        doc.__v = freshDoc.__v;
        continue;
      }
      throw error;
    }
  }
  console.error(`❌ Failed to save after ${retries} attempts`);
  return false;
};

// Hold seats for 5 minutes
// Hold seats for 5 minutes
const holdSeats = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user.id;
    
    console.log('\n========== HOLD SEATS REQUEST ==========');
    console.log('showId:', showId);
    console.log('Requested seats:', seats);
    console.log('UserId:', userId);
    
    if (!showId) {
      return res.status(400).json({ success: false, message: 'Show ID is required' });
    }
    
    let show = await Show.findById(showId);
    if (!show) {
      console.log('Show not found:', showId);
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    const now = new Date();
    
    // Initialize arrays if they don't exist
    if (!show.temporaryHolds) show.temporaryHolds = [];
    if (!show.bookedSeats) show.bookedSeats = [];
    
    // Clean expired holds
    const beforeCount = show.temporaryHolds.length;
    show.temporaryHolds = show.temporaryHolds.filter(hold => new Date(hold.expiresAt) > now);
    console.log(`Cleaned ${beforeCount - show.temporaryHolds.length} expired holds`);
    
    // CASE 1: Release ALL holds for this user
    if (!seats || seats.length === 0) {
      console.log('Releasing ALL holds for user:', userId);
      show.temporaryHolds = show.temporaryHolds.filter(hold => hold.userId !== userId);
      await show.save();
      return res.json({ success: true, message: 'All seats released', heldSeats: [] });
    }
    
    // CASE 2: Release SPECIFIC seats (when deselecting)
    // Check if user currently holds these seats
    const userCurrentHolds = show.temporaryHolds.filter(hold => hold.userId === userId);
    const userSeats = userCurrentHolds.map(h => h.seatNumber);
    
    // If requesting to release seats that the user currently holds
    const seatsToRelease = seats.filter(s => userSeats.includes(s));
    
    if (seatsToRelease.length > 0 && seats.length === 1 && seatsToRelease.length === 1) {
      // This is a deselection - release only this seat
      console.log('Releasing specific seat:', seatsToRelease[0], 'for user:', userId);
      show.temporaryHolds = show.temporaryHolds.filter(
        hold => !(hold.seatNumber === seatsToRelease[0] && hold.userId === userId)
      );
      await show.save();
      return res.json({ 
        success: true, 
        message: `Seat ${seatsToRelease[0]} released`, 
        heldSeats: show.temporaryHolds.filter(h => h.userId === userId).map(h => h.seatNumber)
      });
    }
    
    // Check if seats are already BOOKED
    const alreadyBooked = seats.filter(seat => show.bookedSeats.includes(seat));
    if (alreadyBooked.length > 0) {
      console.log('❌ Seats already BOOKED:', alreadyBooked);
      return res.status(400).json({ 
        success: false, 
        message: `Seats ${alreadyBooked.join(', ')} are already booked!` 
      });
    }
    
    // Check if seats are on HOLD by OTHER users
    const heldByOthers = seats.filter(seat => {
      const hold = show.temporaryHolds.find(h => h.seatNumber === seat && h.userId !== userId);
      return !!hold;
    });
    
    if (heldByOthers.length > 0) {
      console.log('❌ Seats HELD by others:', heldByOthers);
      return res.status(400).json({ 
        success: false, 
        message: `Seats ${heldByOthers.join(', ')} are being booked by another user.` 
      });
    }
    
    // Remove existing holds for these seats from THIS user
    show.temporaryHolds = show.temporaryHolds.filter(
      hold => !(seats.includes(hold.seatNumber) && hold.userId === userId)
    );
    
    // Add new holds (5 minutes)
    const expiresAt = new Date(Date.now() + 300000);
    seats.forEach(seat => {
      show.temporaryHolds.push({
        seatNumber: seat,
        userId: userId,
        expiresAt: expiresAt
      });
    });
    
    await show.save();
    
    console.log('✅ SUCCESS: Seats HELD for user', userId, 'seats:', seats);
    console.log('==========================================\n');
    
    res.json({ 
      success: true,
      message: 'Seats held for 5 minutes', 
      expiresAt: expiresAt,
      heldSeats: seats
    });
    
  } catch (error) {
    console.error('Hold seats error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Create booking
const createBooking = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user.id;
    
    if (!showId || !seats || seats.length === 0) {
      return res.status(400).json({ success: false, message: 'Show ID and seats are required' });
    }
    
    let show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    const now = new Date();
    
    // Clean expired holds
    if (show.temporaryHolds) {
      show.temporaryHolds = show.temporaryHolds.filter(hold => new Date(hold.expiresAt) > now);
    }
    
    // Check if seats are already booked
    const alreadyBooked = seats.filter(seat => (show.bookedSeats || []).includes(seat));
    if (alreadyBooked.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Seats ${alreadyBooked.join(', ')} are already booked!` 
      });
    }
    
    // Check if seats are on hold for this user
    const notHeldByUser = seats.filter(seat => {
      const hold = (show.temporaryHolds || []).find(h => 
        h.seatNumber === seat && h.userId === userId
      );
      return !hold;
    });
    
    if (notHeldByUser.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Seat hold expired for seats ${notHeldByUser.join(', ')}. Please reselect.` 
      });
    }
    
    const pricePerSeat = show.pricePerSeat || show.price || 150;
    const totalPrice = seats.length * pricePerSeat;
    
    // Add to booked seats
    show.bookedSeats.push(...seats);
    
    // Remove holds for these seats
    show.temporaryHolds = (show.temporaryHolds || []).filter(
      hold => !seats.includes(hold.seatNumber)
    );
    
    await saveWithRetry(show);
    
    const booking = await Booking.create({
      userId,
      showId,
      seats,
      totalPrice,
      bookingStatus: 'confirmed'
    });
    
    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully!',
      booking: booking
    });
    
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Get my bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id, bookingStatus: 'confirmed' })
      .populate({ path: 'showId', populate: { path: 'movieId' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all bookings (admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate({ path: 'showId', populate: { path: 'movieId' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const show = await Show.findById(booking.showId);
    if (show) {
      show.bookedSeats = (show.bookedSeats || []).filter(s => !booking.seats.includes(s));
      await show.save();
    }
    
    booking.bookingStatus = 'cancelled';
    await booking.save();
    
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { holdSeats, createBooking, getMyBookings, getAllBookings, cancelBooking };