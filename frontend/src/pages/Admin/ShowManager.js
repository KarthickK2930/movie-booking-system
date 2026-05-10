import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const ShowManager = () => {
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [screenConfig, setScreenConfig] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [extendModal, setExtendModal] = useState(null);
  const [deleteDateModal, setDeleteDateModal] = useState(null);
  const [formData, setFormData] = useState({
    movieId: '',
    startDate: '',
    endDate: '',
    theatreName: '',
    price: 150,
    totalSeats: 50
  });
  const [editFormData, setEditFormData] = useState({
    newShowTimes: [],
    theatreName: '',
    price: 150,
    totalSeats: 50
  });
  const [extendData, setExtendData] = useState({
    newEndDate: ''
  });
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    fetchData();
    fetchScreenConfig();
  }, []);

  const fetchData = async () => {
    try {
      const [showsRes, moviesRes] = await Promise.all([
        api.get('/shows/admin/all'),
        api.get('/movies')
      ]);
      
      const showsData = showsRes.data?.data || showsRes.data || [];
      const moviesData = moviesRes.data?.data || moviesRes.data || [];
      
      setShows(Array.isArray(showsData) ? showsData : []);
      setMovies(Array.isArray(moviesData) ? moviesData : []);
    } catch (err) {
      console.error(err);
      setShows([]);
      setMovies([]);
    }
  };

  const fetchScreenConfig = async () => {
    try {
      const res = await api.get('/screens');
      const screen = res.data?.data || res.data;
      if (screen) {
        setScreenConfig(screen);
        setFormData(prev => ({
          ...prev,
          price: screen.pricePerSeat || 150,
          totalSeats: screen.totalSeats || 50,
          theatreName: screen.theatreName || 'Main Theatre'
        }));
      }
    } catch (err) {
      console.error('Error fetching screen config:', err);
    }
  };

  // Check if movie already has shows in date range
  const checkExistingShows = (movieId, startDate, endDate) => {
    const movieShows = shows.filter(show => show.movieId?._id === movieId || show.movieId === movieId);
    const existingDates = new Set();
    
    movieShows.forEach(show => {
      if (show.date >= startDate && show.date <= endDate) {
        existingDates.add(show.date);
      }
    });
    
    return existingDates;
  };

  const handleGenerateShows = async (e) => {
    e.preventDefault();
    if (!formData.movieId || !formData.startDate || !formData.endDate) {
      alert('Please fill movie and date range');
      return;
    }
    
    // Check for existing shows
    const existingDates = checkExistingShows(formData.movieId, formData.startDate, formData.endDate);
    if (existingDates.size > 0) {
      const dateList = Array.from(existingDates).join(', ');
      if (!window.confirm(`⚠️ Warning: This movie already has shows on these dates: ${dateList}\n\nGenerating shows will skip these dates. Do you want to continue?`)) {
        return;
      }
    }
    
    try {
      const response = await api.post('/shows/generate-range', {
        movieId: formData.movieId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        theatreName: screenConfig?.theatreName || formData.theatreName,
        price: screenConfig?.pricePerSeat || formData.price,
        totalSeats: screenConfig?.totalSeats || formData.totalSeats
      });
      
      const message = response.data?.message || 'Shows generated successfully!';
      alert(message);
      setShowForm(false);
      setFormData({ movieId: '', startDate: '', endDate: '', theatreName: '', price: 150, totalSeats: 50 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating shows');
    }
  };

  // Extend show end date
  const handleExtendDate = async (e) => {
    e.preventDefault();
    if (!extendModal || !extendData.newEndDate) {
      alert('Please select a new end date');
      return;
    }
    
    if (new Date(extendData.newEndDate) < new Date(extendModal.currentEndDate)) {
      alert('New end date cannot be earlier than current end date');
      return;
    }
    
    try {
      await api.post('/shows/extend-date', {
        movieId: extendModal.movieId,
        currentEndDate: extendModal.currentEndDate,
        newEndDate: extendData.newEndDate,
        theatreName: screenConfig?.theatreName,
        price: screenConfig?.pricePerSeat,
        totalSeats: screenConfig?.totalSeats
      });
      alert(`Shows extended until ${extendData.newEndDate}`);
      setExtendModal(null);
      setExtendData({ newEndDate: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error extending shows');
    }
  };

  // Delete shows for a specific date
  const handleDeleteDate = async () => {
    if (!deleteDateModal) return;
    
    const { movieId, date, showCount } = deleteDateModal;
    
    if (showCount > 0) {
      if (!window.confirm(`⚠️ Warning: This date has ${showCount} show(s). Deleting will remove all shows for ${date}. Are you sure?`)) {
        return;
      }
    }
    
    try {
      await api.delete(`/shows/delete-date/${movieId}/${date}`);
      alert(`All shows for ${date} deleted successfully`);
      setDeleteDateModal(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting shows');
    }
  };

  const handleModifyDate = async (e) => {
    e.preventDefault();
    if (!editModal || editFormData.newShowTimes.length === 0) {
      alert('Please add at least one show time');
      return;
    }
    
    try {
      await api.put('/shows/update-date', {
        movieId: editModal.movieId,
        date: editModal.date,
        newShowTimes: editFormData.newShowTimes,
        theatreName: editFormData.theatreName || screenConfig?.theatreName,
        price: editFormData.price || screenConfig?.pricePerSeat,
        totalSeats: editFormData.totalSeats || screenConfig?.totalSeats
      });
      alert('Shows updated successfully!');
      setEditModal(null);
      setEditFormData({ newShowTimes: [], theatreName: '', price: 150, totalSeats: 50 });
      setNewTime('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating shows');
    }
  };

  const addShowTime = () => {
    if (newTime && !editFormData.newShowTimes.includes(newTime)) {
      setEditFormData({
        ...editFormData,
        newShowTimes: [...editFormData.newShowTimes, newTime]
      });
      setNewTime('');
    }
  };

  const removeShowTime = (timeToRemove) => {
    setEditFormData({
      ...editFormData,
      newShowTimes: editFormData.newShowTimes.filter(t => t !== timeToRemove)
    });
  };

  const deleteShow = async (id) => {
    if (window.confirm('Delete this specific show?')) {
      try {
        await api.delete(`/shows/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting show');
      }
    }
  };

  const groupShowsByDate = () => {
    const grouped = {};
    if (!Array.isArray(shows)) return grouped;
    shows.forEach(show => {
      if (show && show.date) {
        if (!grouped[show.date]) {
          grouped[show.date] = [];
        }
        grouped[show.date].push(show);
      }
    });
    return grouped;
  };

  // Get unique movies with their date ranges
  const getMovieDateRanges = () => {
    const movieMap = new Map();
    shows.forEach(show => {
      const movieId = show.movieId?._id || show.movieId;
      const movieTitle = show.movieId?.title || 'Unknown';
      if (!movieMap.has(movieId)) {
        movieMap.set(movieId, { title: movieTitle, dates: [] });
      }
      movieMap.get(movieId).dates.push(show.date);
    });
    
    const ranges = [];
    for (const [movieId, data] of movieMap) {
      const dates = [...new Set(data.dates)].sort();
      if (dates.length > 0) {
        ranges.push({
          movieId,
          title: data.title,
          startDate: dates[0],
          endDate: dates[dates.length - 1],
          totalDates: dates.length
        });
      }
    }
    return ranges;
  };

  const btnPrimary = { background: '#1a1a2e', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const btnSuccess = { background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const btnWarning = { background: '#ffc107', color: '#333', padding: '5px 12px', margin: '0 5px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const btnDanger = { background: '#dc3545', color: 'white', padding: '5px 12px', margin: '0 5px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const btnInfo = { background: '#17a2b8', color: 'white', padding: '5px 12px', margin: '0 5px', border: 'none', borderRadius: 4, cursor: 'pointer' };
  const inputStyle = { width: '100%', padding: 10, margin: '10px 0', border: '1px solid #ddd', borderRadius: 4 };
  const modalStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
  const modalContent = { background: 'white', padding: 30, borderRadius: 12, width: 500, maxHeight: '80vh', overflowY: 'auto' };
  const cardStyle = { border: '1px solid #ddd', borderRadius: 8, padding: 15, marginBottom: 15, background: 'white', minWidth: '200px' };
  const dateCardStyle = { border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 20, background: '#f9f9f9' };

  const groupedShows = groupShowsByDate();
  const movieRanges = getMovieDateRanges();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Show Management</h2>
        <button onClick={() => setShowForm(true)} style={btnPrimary}>+ Schedule Movie (Generate Shows)</button>
      </div>

      {screenConfig && (
        <div style={{ background: '#e8f4f8', padding: 10, borderRadius: 8, marginBottom: 15 }}>
          📺 <strong>Screen Config:</strong> {screenConfig.theatreName || 'Main Theatre'} | 
          💺 {screenConfig.totalSeats || 50} seats | 
          💰 ₹{screenConfig.pricePerSeat || 150} per seat
        </div>
      )}

      {/* Current Movie Date Ranges */}
      {movieRanges.length > 0 && (
        <div style={{ background: '#e8f5e9', padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <h4 style={{ margin: 0, marginBottom: 10 }}>📅 Current Movie Schedules:</h4>
          {movieRanges.map(range => (
            <div key={range.movieId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span><strong>{range.title}</strong>: {range.startDate} to {range.endDate} ({range.totalDates} days)</span>
              <div>
                <button 
                  onClick={() => {
                    setExtendModal({
                      movieId: range.movieId,
                      currentEndDate: range.endDate,
                      movieTitle: range.title
                    });
                    setExtendData({ newEndDate: '' });
                  }} 
                  style={btnInfo}
                >
                  📅 Extend
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ marginBottom: 15, color: '#666', background: '#fff3cd', padding: 10, borderRadius: 8 }}>
        📅 <strong>How it works:</strong> Select movie → Enter Start Date & End Date → System auto-generates shows.<br/>
        🟢 <strong>Weekdays (Mon-Fri):</strong> 4 shows per day | 🟡 <strong>Weekends (Sat-Sun):</strong> 5 shows per day<br/>
        ✏️ <strong>Modify:</strong> Click "Modify Shows" on any date to change show times.<br/>
        🗑️ <strong>Delete Date:</strong> Click "Delete Date" to remove all shows for a specific date.<br/>
        📅 <strong>Extend:</strong> Click "Extend" to add more dates to existing movie schedule.
      </p>

      {shows.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 40 }}>No shows scheduled. Click "Schedule Movie" to create shows.</p>
      ) : (
        Object.entries(groupedShows).map(([date, dateShows]) => (
          <div key={date} style={dateCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ margin: 0 }}>📅 {date}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => {
                    setDeleteDateModal({
                      movieId: dateShows[0]?.movieId?._id || dateShows[0]?.movieId,
                      date: date,
                      showCount: dateShows.length
                    });
                  }} 
                  style={btnDanger}
                >
                  🗑️ Delete All Shows for this Date
                </button>
                <button 
                  onClick={() => {
                    setEditModal({ movieId: dateShows[0]?.movieId?._id || dateShows[0]?.movieId, date });
                    setEditFormData({
                      newShowTimes: dateShows.map(s => s.time),
                      theatreName: dateShows[0]?.theatreName || screenConfig?.theatreName || '',
                      price: dateShows[0]?.price || screenConfig?.pricePerSeat || 150,
                      totalSeats: dateShows[0]?.totalSeats || screenConfig?.totalSeats || 50
                    });
                  }} 
                  style={btnWarning}
                >
                  ✏️ Modify Shows for this Date
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {dateShows.map(show => (
                <div key={show._id} style={cardStyle}>
                  <div>
                    <strong>🎬 {show.movieId?.title}</strong>
                    <p>🕐 {show.time}</p>
                    <p>🏢 {show.theatreName}</p>
                    <p>💰 ₹{show.price} | 💺 {show.totalSeats - (show.bookedSeats?.length || 0)}/{show.totalSeats} seats</p>
                    <span style={{ color: show.isActive ? '#28a745' : '#dc3545', fontSize: 12 }}>
                      {show.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <button onClick={() => deleteShow(show._id)} style={btnDanger}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Generate Shows Modal */}
      {showForm && (
        <div style={modalStyle}>
          <div style={modalContent}>
            <h3>Schedule Movie & Generate Shows</h3>
            <p style={{ color: '#666', marginBottom: 15 }}>
              Price and seats will be taken from Screen Configuration
            </p>
            
            <form onSubmit={handleGenerateShows}>
              <label>Select Movie:</label>
              <select required style={inputStyle} onChange={e => setFormData({...formData, movieId: e.target.value})}>
                <option value="">-- Select Movie --</option>
                {movies.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
              </select>
              
              <label>Theatre Name:</label>
              <input type="text" style={inputStyle} value={screenConfig?.theatreName || formData.theatreName} disabled />
              
              <label>Start Date:</label>
              <input type="date" required style={inputStyle} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              
              <label>End Date:</label>
              <input type="date" required style={inputStyle} onChange={e => setFormData({...formData, endDate: e.target.value})} />
              
              <label>Price per Seat (₹):</label>
              <input type="number" style={inputStyle} value={screenConfig?.pricePerSeat || formData.price} disabled />
              
              <label>Total Seats:</label>
              <input type="number" style={inputStyle} value={screenConfig?.totalSeats || formData.totalSeats} disabled />
              
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" style={btnSuccess}>Generate Shows</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Date Modal */}
      {extendModal && (
        <div style={modalStyle}>
          <div style={modalContent}>
            <h3>Extend Show Dates</h3>
            <p><strong>Movie:</strong> {extendModal.movieTitle}</p>
            <p><strong>Current End Date:</strong> {extendModal.currentEndDate}</p>
            
            <form onSubmit={handleExtendDate}>
              <label>New End Date:</label>
              <input 
                type="date" 
                required 
                style={inputStyle} 
                min={extendModal.currentEndDate}
                value={extendData.newEndDate}
                onChange={e => setExtendData({ newEndDate: e.target.value })}
              />
              
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" style={btnSuccess}>Extend Shows</button>
                <button type="button" onClick={() => setExtendModal(null)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Date Confirmation Modal */}
      {deleteDateModal && (
        <div style={modalStyle}>
          <div style={modalContent}>
            <h3>Delete All Shows for {deleteDateModal.date}</h3>
            <p><strong>Date:</strong> {deleteDateModal.date}</p>
            <p><strong>Total Shows:</strong> {deleteDateModal.showCount}</p>
            <p style={{ color: 'red' }}>⚠️ This action cannot be undone!</p>
            
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={handleDeleteDate} style={btnDanger}>Confirm Delete</button>
              <button onClick={() => setDeleteDateModal(null)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Modify Date Modal */}
      {editModal && (
        <div style={modalStyle}>
          <div style={modalContent}>
            <h3>Modify Shows for {editModal.date}</h3>
            <p style={{ color: '#666', marginBottom: 15 }}>Add or remove show times for this specific date</p>
            
            <form onSubmit={handleModifyDate}>
              <label>Theatre Name:</label>
              <input type="text" style={inputStyle} value={editFormData.theatreName} onChange={e => setEditFormData({...editFormData, theatreName: e.target.value})} />
              
              <label>Price per Seat (₹):</label>
              <input type="number" style={inputStyle} value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: parseInt(e.target.value)})} />
              
              <label>Total Seats:</label>
              <input type="number" style={inputStyle} value={editFormData.totalSeats} onChange={e => setEditFormData({...editFormData, totalSeats: parseInt(e.target.value)})} />
              
              <label>Show Times:</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input type="time" style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 4 }} value={newTime} onChange={e => setNewTime(e.target.value)} />
                <button type="button" onClick={addShowTime} style={btnSuccess}>+ Add</button>
              </div>
              
              {editFormData.newShowTimes.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {editFormData.newShowTimes.map(time => (
                    <span key={time} style={{ background: '#e0e0e0', padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      🕐 {time}
                      <button type="button" onClick={() => removeShowTime(time)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" style={btnPrimary}>Update Shows</button>
                <button type="button" onClick={() => setEditModal(null)} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowManager;