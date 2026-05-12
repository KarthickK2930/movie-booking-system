import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Helper function to convert time string to sortable number
  const convertTimeToNumber = (timeStr) => {
    if (!timeStr) return 0;
    
    // Handle formats like "10:00 AM", "1:00 PM", "9:00 AM"
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      
      if (ampm === 'PM' && hours !== 12) {
        hours += 12;
      }
      if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    }
    return 0;
  };

  // Sort shows by time
  const sortShowsByTime = (showsArray) => {
    return [...showsArray].sort((a, b) => {
      const timeA = convertTimeToNumber(a.time);
      const timeB = convertTimeToNumber(b.time);
      return timeA - timeB;
    });
  };

  useEffect(() => {
    fetchMovieAndDates();
  }, [id]);

  useEffect(() => {
    if (selectedDate) {
      fetchShowsByDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchMovieAndDates = async () => {
    try {
      // Fetch movie details
      const movieRes = await api.get(`/movies/${id}`);
      const movieData = movieRes.data?.data || movieRes.data;
      setMovie(movieData);
      
      // Fetch available dates for this movie
      const datesRes = await api.get(`/shows/dates/${id}`);
      const dates = datesRes.data?.availableDates || datesRes.data?.data || [];
      setAvailableDates(dates);
      
      if (dates && dates.length > 0) {
        setSelectedDate(dates[0]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching movie:', err);
      setLoading(false);
    }
  };

  const fetchShowsByDate = async (date) => {
    try {
      const response = await api.get(`/shows/movie/${id}/date/${date}`);
      const showsData = response.data?.data || response.data || [];
      const showsArray = Array.isArray(showsData) ? showsData : [];
      
      // Sort shows by time
      const sortedShows = sortShowsByTime(showsArray);
      setShows(sortedShows);
    } catch (err) {
      console.error('Error fetching shows:', err);
      setShows([]);
    }
  };

  const handleShowSelect = (showId) => {
    navigate(`/seats/${showId}`);
  };

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()]
    };
  };

  // Format time display (ensure consistent AM/PM format)
  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return 'N/A';
    
    // If time already has AM/PM, return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    
    // Convert 24-hour format to 12-hour format with AM/PM
    const match = timeStr.match(/(\d+):(\d+)/);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    return timeStr;
  };

  if (loading) return <LoadingSpinner />;
  if (!movie) return <div style={{ textAlign: 'center', padding: 50 }}>Movie not found</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
        <img 
          src={movie.poster || 'https://via.placeholder.com/250x380?text=No+Poster'} 
          alt={movie.title}
          style={{ width: '250px', height: '380px', objectFit: 'cover', borderRadius: '8px' }}
        />
        <div>
          <h1>{movie.title}</h1>
          <p style={{ color: '#666', margin: '10px 0' }}>⏱️ {movie.duration || 'N/A'} | 🗣️ {movie.language || 'N/A'}</p>
          <p style={{ lineHeight: '1.6', marginTop: '15px' }}>{movie.description || 'No description available'}</p>
        </div>
      </div>

      <h2>Select Date</h2>
      {availableDates.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', background: '#f5f5f5', borderRadius: 8 }}>
          No shows available for this movie.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '10px 0', marginBottom: '30px' }}>
          {availableDates.map(date => {
            const formatted = formatDateDisplay(date);
            const isSelected = selectedDate === date;
            
            return (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                style={{
                  minWidth: '80px',
                  padding: '12px',
                  background: isSelected ? '#e50914' : 'white',
                  color: isSelected ? 'white' : '#333',
                  border: `1px solid ${isSelected ? '#e50914' : '#ddd'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ fontSize: '14px' }}>{formatted.day}</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatted.date}</div>
                <div style={{ fontSize: '12px' }}>{formatted.month}</div>
              </button>
            );
          })}
        </div>
      )}

      <h2>Select Show Time</h2>
      {shows.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px' }}>No shows available for this date.</p>
      ) : (
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {shows.map((show) => (
            <div key={show._id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              minWidth: '180px',
              background: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            }}>
              <p><strong>🕐 {formatTimeDisplay(show.time)}</strong></p>
              <p>🎭 {show.theatreName || 'Main Theatre'}</p>
              <p>💰 ₹{show.price || 150}</p>
              <p style={{ fontSize: '12px', color: '#28a745' }}>
                💺 {(show.totalSeats || 50) - (show.bookedSeats?.length || 0)} seats available
              </p>
              <button
                onClick={() => handleShowSelect(show._id)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: '#e50914',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Book Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieDetails;