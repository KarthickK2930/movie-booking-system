const Movie = require('../models/Movie');

// @desc    Get all movies
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new movie (Admin only)
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = async (req, res) => {
  try {
    const { title, description, poster, duration, language, year, releaseDate } = req.body;
    
    if (!title || !description || !poster || !duration || !language || !year || !releaseDate) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }
    
    const movie = await Movie.create({
      title,
      description,
      poster,
      duration,
      language,
      year,
      releaseDate
    });
    
    res.status(201).json({
      message: 'Movie created successfully',
      movie
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a movie (Admin only)
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const { title, description, poster, duration, language, year, releaseDate } = req.body;
    
    movie.title = title || movie.title;
    movie.description = description || movie.description;
    movie.poster = poster || movie.poster;
    movie.duration = duration || movie.duration;
    movie.language = language || movie.language;
    movie.year = year || movie.year;
    movie.releaseDate = releaseDate || movie.releaseDate;
    
    await movie.save();
    
    res.json({
      message: 'Movie updated successfully',
      movie
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a movie (Admin only)
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    await movie.deleteOne();
    
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie
};