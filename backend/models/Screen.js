const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Main Screen' },
  totalSeats: { type: Number, required: true, default: 50 },
  pricePerSeat: { type: Number, required: true, default: 150 }
}, { timestamps: true });

module.exports = mongoose.model('Screen', ScreenSchema);