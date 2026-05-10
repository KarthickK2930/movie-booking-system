const mongoose = require('mongoose');

const ShowSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theatreName: { type: String, required: true, default: 'Main Theatre' },
  date: { type: String, required: true },
  time: { type: String, required: true },
  price: { type: Number, default: 150 },
  totalSeats: { type: Number, default: 50 },
  bookedSeats: { type: [Number], default: [] },
  temporaryHolds: { 
    type: [{
      seatNumber: Number,
      userId: String,
      expiresAt: Date
    }], 
    default: [] 
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

ShowSchema.index({ movieId: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Show', ShowSchema);