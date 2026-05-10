import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ScreenManager = () => {
  const [screen, setScreen] = useState({ name: 'Main Screen', totalSeats: 50, pricePerSeat: 150 });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchScreen();
  }, []);

  const fetchScreen = async () => {
    try {
      const res = await api.get('/screens');
      if (res.data) setScreen(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/screens', screen);
      alert('Screen updated');
      setEditing(false);
      fetchScreen();
    } catch (err) {
      alert('Error saving screen');
    }
  };

  const inputStyle = { width: '100%', padding: 10, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 };
  const btnPrimary = { background: '#1a1a2e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' };

  if (!editing) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Screen Configuration</h2>
          <button onClick={() => setEditing(true)} style={btnPrimary}>Edit</button>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, marginTop: 15 }}>
          <h3>{screen.name}</h3>
          <p>💺 Total Seats: {screen.totalSeats}</p>
          <p>💰 Price per Seat: ₹{screen.pricePerSeat}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Edit Screen</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Screen Name" value={screen.name} onChange={e => setScreen({...screen, name: e.target.value})} style={inputStyle} required />
        <input type="number" placeholder="Total Seats" value={screen.totalSeats} onChange={e => setScreen({...screen, totalSeats: parseInt(e.target.value)})} style={inputStyle} required />
        <input type="number" placeholder="Price per Seat (₹)" value={screen.pricePerSeat} onChange={e => setScreen({...screen, pricePerSeat: parseInt(e.target.value)})} style={inputStyle} required />
        <button type="submit" style={btnPrimary}>Save</button>
        <button type="button" onClick={() => setEditing(false)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', marginLeft: 10, border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
      </form>
    </div>
  );
};

export default ScreenManager;