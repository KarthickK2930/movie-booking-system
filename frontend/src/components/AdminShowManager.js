import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminShowManager = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    movieId: '',
    showTime: '',
    showDate: '',
    pricePerSeat: 150,
    totalSeats: 50
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [showsRes, moviesRes] = await Promise.all([
        api.get('/shows/admin/all'),
        api.get('/movies')
      ]);
      setShows(showsRes.data);
      setMovies(moviesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/shows', formData);
      alert('Show created successfully!');
      setShowForm(false);
      setFormData({ movieId: '', showTime: '', showDate: '', pricePerSeat: 150, totalSeats: 50 });
      fetchData();
    } catch (err) {
      alert('Error creating show');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/shows/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert('Error toggling show');
    }
  };

  const deleteShow = async (id) => {
    if (window.confirm('Delete this show?')) {
      try {
        await api.delete(`/shows/${id}`);
        fetchData();
      } catch (err) {
        alert('Error deleting show');
      }
    }
  };

  const showTimes = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM', '7:00 PM', '9:00 PM'];

  const btnPrimary = { background: '#1a1a2e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const btnWarning = { background: '#ffc107', color: '#333', padding: '5px 12px', margin: '0 5px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const btnDanger = { background: '#dc3545', color: 'white', padding: '5px 12px', margin: '0 5px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const btnSuccess = { background: '#28a745', color: 'white', padding: '5px 12px', margin: '0 5px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  
  const cardStyle = { border: '1px solid #ddd', borderRadius: 8, padding: 15, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' };
  const inputStyle = { width: '100%', padding: 10, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 };
  const modalStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modalContent = { background: 'white', padding: 30, borderRadius: 12, width: 450 };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Show Management</h2>
        <button onClick={() => setShowForm(true)} style={btnPrimary}>+ Add Show</button>
      </div>

      {shows.length === 0 && <p>No shows created yet. Click "Add Show" to create one.</p>}

      {shows.map(show => (
        <div key={show._id} style={cardStyle}>
          <div>
            <h3>{show.movieId?.title}</h3>
            <p>📅 {show.showDate} | 🕐 {show.showTime}</p>
            <p>💰 ₹{show.pricePerSeat} per seat | 💺 Total Seats: {show.totalSeats}</p>
            <p>📊 Booked: {show.bookedSeats?.length || 0} | Available: {(show.totalSeats || 50) - (show.bookedSeats?.length || 0)}</p>
            <span style={{ color: show.isActive ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
              {show.isActive ? '● Active' : '● Inactive'}
            </span>
          </div>
          <div>
            <button onClick={() => toggleStatus(show._id)} style={show.isActive ? btnWarning : btnSuccess}>
              {show.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => deleteShow(show._id)} style={btnDanger}>Delete</button>
          </div>
        </div>
      ))}

      {showForm && (
        <div style={modalStyle}>
          <div style={modalContent}>
            <h3>Add New Show</h3>
            <form onSubmit={handleSubmit}>
              <select required style={inputStyle} onChange={e => setFormData({...formData, movieId: e.target.value})}>
                <option value="">Select Movie</option>
                {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
              
              <input type="date" required style={inputStyle} onChange={e => setFormData({...formData, showDate: e.target.value})} />
              
              <select required style={inputStyle} onChange={e => setFormData({...formData, showTime: e.target.value})}>
                <option value="">Select Show Time</option>
                {showTimes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              
              <input type="number" placeholder="Price per seat (₹)" required style={inputStyle} 
                onChange={e => setFormData({...formData, pricePerSeat: parseInt(e.target.value)})} />
              
              <input type="number" placeholder="Total Seats (default: 50)" style={inputStyle} 
                onChange={e => setFormData({...formData, totalSeats: parseInt(e.target.value)})} />
              
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" style={btnPrimary}>Create Show</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShowManager;