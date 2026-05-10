import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminMovieManager = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    poster: '',
    duration: '',
    language: '',
    year: '',
    releaseDate: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        await api.put(`/movies/${editingMovie._id}`, formData);
        alert('Movie updated successfully');
      } else {
        await api.post('/movies', formData);
        alert('Movie added successfully');
      }
      setFormData({ title: '', description: '', poster: '', duration: '', language: '', year: '', releaseDate: '' });
      setEditingMovie(null);
      fetchMovies();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description,
      poster: movie.poster,
      duration: movie.duration,
      language: movie.language,
      year: movie.year,
      releaseDate: movie.releaseDate
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await api.delete(`/movies/${id}`);
        alert('Movie deleted successfully');
        fetchMovies();
      } catch (err) {
        alert('Failed to delete movie');
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    margin: '10px 0',
    border: '1px solid #ddd',
    borderRadius: '4px'
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Movie Management</h2>
      
      <form onSubmit={handleSubmit} style={{
        background: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>{editingMovie ? 'Edit Movie' : 'Add New Movie'}</h3>
        
        <input type="text" placeholder="Title" value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          style={inputStyle} required />
        
        <textarea placeholder="Description" value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          style={{ ...inputStyle, minHeight: '80px' }} rows="3" required />
        
        <input type="text" placeholder="Poster URL" value={formData.poster}
          onChange={(e) => setFormData({...formData, poster: e.target.value})}
          style={inputStyle} required />
        
        <input type="text" placeholder="Duration (e.g., 150 min)" value={formData.duration}
          onChange={(e) => setFormData({...formData, duration: e.target.value})}
          style={inputStyle} required />
        
        <input type="text" placeholder="Language" value={formData.language}
          onChange={(e) => setFormData({...formData, language: e.target.value})}
          style={inputStyle} required />
        
        <input type="number" placeholder="Year" value={formData.year}
          onChange={(e) => setFormData({...formData, year: e.target.value})}
          style={inputStyle} required />
        
        <input type="date" placeholder="Release Date" value={formData.releaseDate}
          onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
          style={inputStyle} required />
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            {editingMovie ? 'Update' : 'Add'} Movie
          </button>
          {editingMovie && (
            <button type="button" onClick={() => {
              setEditingMovie(null);
              setFormData({ title: '', description: '', poster: '', duration: '', language: '', year: '', releaseDate: '' });
            }} style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div style={{ display: 'grid', gap: '15px' }}>
        {movies.map(movie => (
          <div key={movie._id} style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '15px',
            background: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4>{movie.title} ({movie.year})</h4>
              <p style={{ fontSize: '14px', color: '#666' }}>{movie.duration} | {movie.language}</p>
              <p style={{ fontSize: '12px' }}>Release: {movie.releaseDate}</p>
              <p style={{ fontSize: '12px' }}>{movie.description.substring(0, 100)}...</p>
            </div>
            <div>
              <button onClick={() => handleEdit(movie)} style={{
                padding: '5px 15px',
                margin: '0 5px',
                background: '#ffc107',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>Edit</button>
              <button onClick={() => handleDelete(movie._id)} style={{
                padding: '5px 15px',
                margin: '0 5px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMovieManager;