const Booking = require('../models/Booking');
const Show = require('../models/Show');

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
    
    // CASE 1: Release all holds
    if (!seats || seats.length === 0) {
      console.log('Releasing all holds for user:', userId);
      show.temporaryHolds = show.temporaryHolds.filter(hold => hold.userId !== userId);
      await saveWithRetry(show);
      return res.json({ success: true, message: 'All seats released', heldSeats: [] });
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
    
    await saveWithRetry(show);
    
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
    
    console.log('\n========== CREATE BOOKING REQUEST ==========');
    console.log('showId:', showId);
    console.log('seats:', seats);
    console.log('userId:', userId);
    
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    const now = new Date();
    
    // Clean expired holds
    show.temporaryHolds = (show.temporaryHolds || []).filter(hold => new Date(hold.expiresAt) > now);
    
    console.log('Current BOOKED seats:', show.bookedSeats);
    console.log('Current ACTIVE HOLDS:', show.temporaryHolds.map(h => ({ seat: h.seatNumber, user: h.userId })));
    
    // CHECK 1: Seats already BOOKED?
    const alreadyBooked = seats.filter(seat => (show.bookedSeats || []).includes(seat));
    if (alreadyBooked.length > 0) {
      console.log('❌ FAILED: Seats already BOOKED:', alreadyBooked);
      return res.status(400).json({ 
        success: false, 
        message: `Seats ${alreadyBooked.join(', ')} are already booked!` 
      });
    }
    
    // CHECK 2: Seats are on HOLD for THIS user?
    const notHeldByUser = seats.filter(seat => {
      const hold = (show.temporaryHolds || []).find(h => 
        h.seatNumber === seat && h.userId === userId
      );
      return !hold;
    });
    
    if (notHeldByUser.length > 0) {
      console.log('❌ FAILED: Seats not on hold for this user:', notHeldByUser);
      return res.status(400).json({ 
        success: false, 
        message: `Seat hold expired for seats ${notHeldByUser.join(', ')}. Please reselect and try again.` 
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
    
    await show.save();
    console.log('✅ SUCCESS: Booking created! Seats:', seats);
    console.log('==========================================\n');
    
    const booking = await Booking.create({
      userId,
      showId,
      seats,
      totalPrice,
      bookingStatus: 'confirmed'
    });
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email')
      .populate({
        path: 'showId',
        populate: { path: 'movieId' }
      });
    
    res.status(201).json({
      success: true,
      message: 'Tickets booked successfully!',
      booking: populatedBooking
    });
    
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// Get my bookings
// Get my bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id, bookingStatus: 'confirmed' })
      .populate({
        path: 'showId',
        populate: { path: 'movieId' }
      })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error', data: [] });
  }
};

// Get all bookings (admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email')
      .populate({
        path: 'showId',
        populate: { path: 'movieId' }
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get all bookings error:', error);
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
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { holdSeats, createBooking, getMyBookings, getAllBookings, cancelBooking };