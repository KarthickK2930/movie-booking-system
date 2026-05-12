const Booking = require('../models/Booking');
const Show = require('../models/Show');

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
    
    const show = await Show.findById(showId);
    if (!show) {
      console.log('Show not found:', showId);
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    const now = new Date();
    
    // Clean expired holds
    if (show.temporaryHolds) {
      const beforeCount = show.temporaryHolds.length;
      show.temporaryHolds = show.temporaryHolds.filter(hold => new Date(hold.expiresAt) > now);
      console.log(`Cleaned ${beforeCount - show.temporaryHolds.length} expired holds`);
    } else {
      show.temporaryHolds = [];
    }
    
    // CASE 1: If seats is empty array, RELEASE ALL holds for this user
    if (!seats || seats.length === 0) {
      console.log('Releasing all holds for user:', userId);
      
      const beforeCount = show.temporaryHolds.length;
      show.temporaryHolds = show.temporaryHolds.filter(hold => hold.userId !== userId);
      const afterCount = show.temporaryHolds.length;
      
      console.log(`Released ${beforeCount - afterCount} holds for user ${userId}`);
      await show.save();
      
      return res.json({ 
        success: true,
        message: 'All seats released successfully',
        heldSeats: []
      });
    }
    
    // CASE 2: Normal hold - CHECK existing holds
    console.log('Current BOOKED seats:', show.bookedSeats);
    console.log('Current ACTIVE HOLDS:', JSON.stringify(show.temporaryHolds.map(h => ({ seat: h.seatNumber, user: h.userId })), null, 2));
    
    // Check if seats are already BOOKED
    const alreadyBooked = seats.filter(seat => (show.bookedSeats || []).includes(seat));
    if (alreadyBooked.length > 0) {
      console.log('❌ FAILED: Seats already BOOKED:', alreadyBooked);
      return res.status(400).json({ 
        success: false, 
        message: `Seats ${alreadyBooked.join(', ')} are already booked!` 
      });
    }
    
    // Check if seats are on HOLD by OTHER users
    const heldByOthers = [];
    for (const seat of seats) {
      const hold = show.temporaryHolds.find(h => h.seatNumber === seat && h.userId !== userId);
      if (hold) {
        heldByOthers.push(seat);
      }
    }
    
    if (heldByOthers.length > 0) {
      console.log('❌ FAILED: Seats on HOLD by OTHER users:', heldByOthers);
      return res.status(400).json({ 
        success: false, 
        message: `Seats ${heldByOthers.join(', ')} are currently being booked by another user.` 
      });
    }
    
    // Remove any existing holds for these seats from THIS user
    show.temporaryHolds = show.temporaryHolds.filter(
      hold => !(seats.includes(hold.seatNumber) && hold.userId === userId)
    );
    
    // Add new holds (5 minutes = 300000 ms)
    const expiresAt = new Date(Date.now() + 300000);
    seats.forEach(seat => {
      show.temporaryHolds.push({
        seatNumber: seat,
        userId: userId,
        expiresAt: expiresAt
      });
    });
    
    await show.save();
    
    console.log('Current ACTIVE HOLDS AFTER:', JSON.stringify(show.temporaryHolds.map(h => ({ seat: h.seatNumber, user: h.userId })), null, 2));
    console.log('✅ SUCCESS: Seats HELD for user', userId, 'seats:', seats);
    console.log('Expires at:', expiresAt);
    
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
    
    if (!showId || !seats || seats.length === 0) {
      return res.status(400).json({ success: false, message: 'Show ID and seats are required' });
    }
    
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    const now = new Date();
    
    // Clean expired holds
    if (show.temporaryHolds) {
      show.temporaryHolds = show.temporaryHolds.filter(hold => new Date(hold.expiresAt) > now);
    } else {
      show.temporaryHolds = [];
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
      const hold = show.temporaryHolds.find(h => 
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
    show.temporaryHolds = show.temporaryHolds.filter(
      hold => !seats.includes(hold.seatNumber)
    );
    
    await show.save();
    
    const booking = await Booking.create({
      userId,
      showId,
      seats,
      totalPrice,
      bookingStatus: 'confirmed'
    });
    
    console.log('✅ Booking created:', booking._id);
    
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
      .populate({
        path: 'showId',
        populate: { path: 'movieId' }
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
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