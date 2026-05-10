const mongoose = require('mongoose');

const TheatreConfigSchema = new mongoose.Schema({
  weekdayShows: {
    type: [String],
    default: ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM']
  },
  weekendShows: {
    type: [String],
    default: ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM']
  },
  pricePerSeat: {
    type: Number,
    default: 150
  },
  totalSeats: {
    type: Number,
    default: 50
  },
  theatreName: {
    type: String,
    default: 'Main Theatre'
  }
}, { timestamps: true });

module.exports = mongoose.model('TheatreConfig', TheatreConfigSchema);