import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MovieCard from './MovieCard';
import LoadingSpinner from './LoadingSpinner';

const MovieList = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await api.get('/movies');
      setMovies(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '60px 40px',
        borderRadius: '16px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎬 BookMyShow Clone</h1>
        <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Book tickets for the latest movies instantly!</p>
      </div>

      <h2 style={{ marginBottom: '30px' }}>Now Showing</h2>
      
      {movies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>No movies available. Admin needs to add movies.</p>
          {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role === 'admin' && (
            <p>Go to Admin Panel to add movies ➡️</p>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '30px'
        }}>
          {movies.map((movie) => (
            <MovieCard key={movie._id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieList;