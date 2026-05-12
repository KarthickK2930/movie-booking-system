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
    
    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    const now = new Date();
    
    // Clean expired holds first
    show.temporaryHolds = (show.temporaryHolds || []).filter(hold => new Date(hold.expiresAt) > now);
    
    // CASE 1: If seats is empty array, RELEASE ALL holds for this user
    if (!seats || seats.length === 0) {
      console.log('RELEASING all holds for user:', userId);
      
      // Remove all holds belonging to this user
      const beforeCount = show.temporaryHolds.length;
      show.temporaryHolds = (show.temporaryHolds || []).filter(hold => hold.userId !== userId);
      const afterCount = show.temporaryHolds.length;
      
      console.log(`Released ${beforeCount - afterCount} holds for user ${userId}`);
      await show.save();
      
      const updatedShow = await Show.findById(showId);
      return res.json({ 
        success: true,
        message: 'All seats released successfully',
        heldSeats: [],
        show: updatedShow
      });
    }
    
    // CASE 2: Update holds - REPLACE all holds for this user with new seats
    console.log('Current BOOKED seats:', show.bookedSeats);
    console.log('Current ACTIVE HOLDS BEFORE:', JSON.stringify(show.temporaryHolds.map(h => ({ seat: h.seatNumber, user: h.userId })), null, 2));
    
    // Check if seats are already BOOKED
    const alreadyBooked = seats.filter(seat => (show.bookedSeats || []).includes(seat));
    if (alreadyBooked.length > 0) {
      console.log('❌ FAILED: Seats already BOOKED:', alreadyBooked);
      return res.status(400).json({ 
        success: false, 
        message: `Seats ${alreadyBooked.join(', ')} are already booked!` 
      });
    }
    
    // Check if seats are on HOLD by OTHER users (excluding current user)
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
    
    // IMPORTANT: Remove ALL holds for THIS user first (replace, not merge)
    show.temporaryHolds = (show.temporaryHolds || []).filter(hold => hold.userId !== userId);
    
    // Add new holds for requested seats (5 minutes = 300000 ms)
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
    console.log('==========================================\n');
    
    const updatedShow = await Show.findById(showId);
    
    res.json({ 
      success: true,
      message: 'Seats held for 5 minutes', 
      expiresAt: expiresAt,
      heldSeats: seats,
      show: updatedShow
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