import React from 'react';
import { useNavigate } from 'react-router-dom';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/movie/${movie._id}`)}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.3s',
        background: 'white'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <img 
        src={movie.poster} 
        alt={movie.title}
        style={{ width: '100%', height: '300px', objectFit: 'cover' }}
      />
      <div style={{ padding: '15px' }}>
        <h3>{movie.title}</h3>
        <p style={{ color: '#666', margin: '5px 0' }}>{movie.duration}</p>
        <p style={{ color: '#888', fontSize: '14px' }}>
          {movie.description.substring(0, 80)}...
        </p>
        <button style={{
          marginTop: '10px',
          padding: '8px 16px',
          background: '#1a1a2e',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Book Tickets →
        </button>
      </div>
    </div>
  );
};

export default MovieCard;