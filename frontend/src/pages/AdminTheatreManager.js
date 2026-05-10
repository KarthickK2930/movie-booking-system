import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const TheatreManager = () => {
  const [theatre, setTheatre] = useState({ name: '', address: '', city: '', bannerImage: '', contactNumber: '', description: '' });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchTheatre();
  }, []);

  const fetchTheatre = async () => {
    const res = await api.get('/theatre');
    if (res.data) setTheatre(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.put('/theatre', theatre);
    alert('Theatre updated');
    setEditing(false);
    fetchTheatre();
  };

  const inputStyle = { width: '100%', padding: 10, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 };
  const btnPrimary = { background: '#1a1a2e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' };

  if (!editing && theatre.name) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Theatre Details</h2>
          <button onClick={() => setEditing(true)} style={btnPrimary}>Edit</button>
        </div>
        {theatre.bannerImage && <img src={theatre.bannerImage} alt="Banner" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 15 }} />}
        <h3>{theatre.name}</h3>
        <p>{theatre.address}, {theatre.city}</p>
        <p>📞 {theatre.contactNumber}</p>
        <p>{theatre.description}</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{theatre.name ? 'Edit Theatre' : 'Add Theatre'}</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Theatre Name" value={theatre.name} onChange={e => setTheatre({...theatre, name: e.target.value})} style={inputStyle} required />
        <input type="text" placeholder="Address" value={theatre.address} onChange={e => setTheatre({...theatre, address: e.target.value})} style={inputStyle} required />
        <input type="text" placeholder="City" value={theatre.city} onChange={e => setTheatre({...theatre, city: e.target.value})} style={inputStyle} required />
        <input type="text" placeholder="Banner Image URL" value={theatre.bannerImage} onChange={e => setTheatre({...theatre, bannerImage: e.target.value})} style={inputStyle} />
        <input type="text" placeholder="Contact Number" value={theatre.contactNumber} onChange={e => setTheatre({...theatre, contactNumber: e.target.value})} style={inputStyle} />
        <textarea placeholder="Description" value={theatre.description} onChange={e => setTheatre({...theatre, description: e.target.value})} style={inputStyle} rows="3" />
        <button type="submit" style={btnPrimary}>Save</button>
        {theatre.name && <button type="button" onClick={() => setEditing(false)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', marginLeft: 10, border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>}
      </form>
    </div>
  );
};

export default TheatreManager;