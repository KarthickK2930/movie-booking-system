const express = require('express');
const Movie = require('../models/Movie');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// Get all movies (Public)
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single movie (Public)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create movie (Admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update movie (Admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete movie (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Movie deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;