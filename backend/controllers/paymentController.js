const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay Order
const createOrder = async (req, res) => {
  try {
    const { showId, seats } = req.body;
    const userId = req.user.id;
    
    console.log('Creating order for:', { showId, seats, userId });
    
    const show = await Show.findById(showId).populate('movieId');
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    // Check if seats are still available
    const alreadyBooked = seats.some(seat => (show.bookedSeats || []).includes(seat));
    if (alreadyBooked) {
      return res.status(400).json({ success: false, message: 'Some seats are already booked!' });
    }
    
    const pricePerSeat = show.pricePerSeat || show.price || 150;
    const totalAmount = seats.length * pricePerSeat;
    const amountInPaise = totalAmount * 100;
    
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        showId: showId,
        seats: seats.join(','),
        userId: userId,
        movie: show.movieId.title
      }
    };
    
    const order = await razorpay.orders.create(options);
    console.log('Order created:', order.id);
    
    res.json({
      success: true,
      orderId: order.id,
      amount: totalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create order' });
  }
};

// Verify Payment and Create Booking
// Verify Payment and Create Booking
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, showId, seats } = req.body;
    const userId = req.user.id;
    
    console.log('=========================================');
    console.log('VERIFYING PAYMENT');
    console.log('Order ID:', razorpay_order_id);
    console.log('Payment ID:', razorpay_payment_id);
    
    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
    
    console.log('✅ Signature MATCHED!');
    
    const show = await Show.findById(showId).populate('movieId');
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    // Check seats
    const alreadyBooked = seats.some(seat => (show.bookedSeats || []).includes(seat));
    if (alreadyBooked) {
      return res.status(400).json({ success: false, message: 'Some seats were already booked!' });
    }
    
    const pricePerSeat = show.pricePerSeat || show.price || 150;
    const totalPrice = seats.length * pricePerSeat;
    
    // Add to booked seats
    show.bookedSeats.push(...seats);
    show.temporaryHolds = (show.temporaryHolds || []).filter(
      hold => !seats.includes(hold.seatNumber)
    );
    await show.save();
    
    // Create booking - WITHOUT any pre-save hook
    const booking = new Booking({
      userId,
      showId,
      seats,
      totalPrice,
      paymentId: razorpay_payment_id,
      paymentStatus: 'success',
      bookingStatus: 'confirmed'
    });
    
    // Generate bookingId manually
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    booking.bookingId = `BKG${year}${month}${day}${random}`;
    
    await booking.save();
    
    console.log('✅ Booking saved:', booking._id);
    console.log('✅ Booking ID:', booking.bookingId);
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email')
      .populate({
        path: 'showId',
        populate: { path: 'movieId' }
      });
    
    res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking: populatedBooking
    });
    
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed' });
  }
};

module.exports = { createOrder, verifyPayment };