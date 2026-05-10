const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  poster: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  releaseDate: {
    type: String,
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Movie', MovieSchema);