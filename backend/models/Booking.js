const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  showId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Show',
    required: true,
  },
  seats: {
    type: [Number],
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentId: {
    type: String,
    default: '',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed',
  },
  qrCode: {
    type: String,
    default: '',
  }
}, {
  timestamps: true,
});

// NO pre-save hook - removed completely

module.exports = mongoose.model('Booking', BookingSchema);