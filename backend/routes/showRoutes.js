const express = require('express');
const Show = require('../models/Show');
const Movie = require('../models/Movie');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// ============ USER ROUTES (Public) ============

// Get shows by movie ID and date
router.get('/movie/:movieId/date/:date', async (req, res) => {
  try {
    const { movieId, date } = req.params;
    const shows = await Show.find({ 
      movieId, 
      date: date,
      isActive: true 
    }).populate('movieId');
    
    res.json({ success: true, data: shows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get available dates for a movie
router.get('/dates/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({ movieId, isActive: true });
    
    const availableDates = [...new Set(shows.map(s => s.date))];
    availableDates.sort();
    
    res.json({ success: true, availableDates });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single show by ID
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id).populate('movieId');
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    res.json({ success: true, data: show });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============ ADMIN ROUTES ============

// Get all shows (Admin)
router.get('/admin/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const shows = await Show.find().populate('movieId');
    res.json({ success: true, data: shows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate shows for date range (Admin)
router.post('/generate-range', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { movieId, startDate, endDate, theatreName, price, totalSeats } = req.body;
    
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    
    const weekdayShows = ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM'];
    const weekendShows = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];
    
    const isWeekend = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      return day === 0 || day === 6;
    };
    
    const getDatesInRange = (start, end) => {
      const dates = [];
      let current = new Date(start);
      let last = new Date(end);
      while (current <= last) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };
    
    const dates = getDatesInRange(startDate, endDate);
    const createdShows = [];
    
    for (const date of dates) {
      const showTimes = isWeekend(date) ? weekendShows : weekdayShows;
      
      for (const time of showTimes) {
        const existingShow = await Show.findOne({ movieId, date, time });
        if (!existingShow) {
          const show = await Show.create({
            movieId,
            theatreName: theatreName || 'Main Theatre',
            date,
            time,
            price: price || 150,
            totalSeats: totalSeats || 50,
            bookedSeats: []
          });
          createdShows.push(show);
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: `Created ${createdShows.length} shows`,
      data: createdShows 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update shows for specific date (Admin)
router.put('/update-date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { movieId, date, newShowTimes, theatreName, price, totalSeats } = req.body;
    
    // Check if any show has bookings
    const existingShows = await Show.find({ movieId, date });
    let hasBookings = false;
    for (const show of existingShows) {
      if (show.bookedSeats && show.bookedSeats.length > 0) {
        hasBookings = true;
        break;
      }
    }
    
    if (hasBookings) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify shows with existing bookings' 
      });
    }
    
    // Delete existing shows
    await Show.deleteMany({ movieId, date });
    
    // Create new shows
    const newShows = [];
    for (const time of newShowTimes) {
      const show = await Show.create({
        movieId,
        theatreName: theatreName || 'Main Theatre',
        date,
        time,
        price: price || 150,
        totalSeats: totalSeats || 50,
        bookedSeats: []
      });
      newShows.push(show);
    }
    
    res.json({ success: true, message: `Updated ${newShows.length} shows`, data: newShows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete show (Admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }
    
    if (show.bookedSeats && show.bookedSeats.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete show with existing bookings' 
      });
    }
    
    await Show.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Show deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Extend show end date (Admin)
router.post('/extend-date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { movieId, currentEndDate, newEndDate, theatreName, price, totalSeats } = req.body;
    
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }
    
    const weekdayShows = ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM'];
    const weekendShows = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'];
    
    const isWeekend = (dateStr) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      return day === 0 || day === 6;
    };
    
    const getDatesInRange = (start, end) => {
      const dates = [];
      let current = new Date(start);
      let endDate = new Date(end);
      current.setDate(current.getDate() + 1); // Start from day after currentEndDate
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    };
    
    const newDates = getDatesInRange(currentEndDate, newEndDate);
    const createdShows = [];
    
    for (const date of newDates) {
      const showTimes = isWeekend(date) ? weekendShows : weekdayShows;
      
      for (const time of showTimes) {
        const existingShow = await Show.findOne({ movieId, date, time });
        if (!existingShow) {
          const show = await Show.create({
            movieId,
            theatreName: theatreName || 'Main Theatre',
            date,
            time,
            price: price || 150,
            totalSeats: totalSeats || 50,
            bookedSeats: []
          });
          createdShows.push(show);
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: `Extended with ${createdShows.length} new shows`,
      data: createdShows 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete all shows for a specific date (Admin)
router.delete('/delete-date/:movieId/:date', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { movieId, date } = req.params;
    
    // Check if any shows have bookings
    const shows = await Show.find({ movieId, date });
    let hasBookings = false;
    for (const show of shows) {
      if (show.bookedSeats && show.bookedSeats.length > 0) {
        hasBookings = true;
        break;
      }
    }
    
    if (hasBookings) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete shows with existing bookings' 
      });
    }
    
    const result = await Show.deleteMany({ movieId, date });
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} shows for date ${date}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;