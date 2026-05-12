import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterShowtime, setFilterShowtime] = useState('');
  const [filterMovie, setFilterMovie] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchAllBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterDate, filterShowtime, filterMovie, filterStatus, bookings]);

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/bookings/admin/all');
      console.log('Bookings API Response:', response.data);
      
      // Handle different response formats
      let bookingsData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          bookingsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          bookingsData = response.data.data;
        } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
          bookingsData = response.data.bookings;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          bookingsData = response.data.data;
        }
      }
      
      setBookings(bookingsData);
      setFilteredBookings(bookingsData);
      setLoading(false);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setBookings([]);
      setFilteredBookings([]);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!Array.isArray(bookings)) {
      setFilteredBookings([]);
      return;
    }
    
    let filtered = [...bookings];
    
    if (filterDate) {
      filtered = filtered.filter(b => b.showId?.date === filterDate || b.showId?.showDate === filterDate);
    }
    if (filterShowtime) {
      filtered = filtered.filter(b => b.showId?.time === filterShowtime || b.showId?.showTime === filterShowtime);
    }
    if (filterMovie) {
      filtered = filtered.filter(b => b.showId?.movieId?.title === filterMovie);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.bookingStatus === filterStatus);
    }
    
    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking? Seats will become available again.')) return;
    
    try {
      await api.delete(`/bookings/${bookingId}`);
      alert('Booking cancelled successfully');
      fetchAllBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'cancelled') {
      return <span style={{ background: '#dc3545', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>Cancelled</span>;
    }
    return <span style={{ background: '#28a745', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>Confirmed</span>;
  };

  const getUniqueMovies = () => {
    if (!Array.isArray(bookings)) return [];
    return [...new Set(bookings.map(b => b.showId?.movieId?.title).filter(Boolean))];
  };

  const getUniqueDates = () => {
    if (!Array.isArray(bookings)) return [];
    return [...new Set(bookings.map(b => b.showId?.date || b.showId?.showDate).filter(Boolean))];
  };

  const getUniqueTimes = () => {
    if (!Array.isArray(bookings)) return [];
    return [...new Set(bookings.map(b => b.showId?.time || b.showId?.showTime).filter(Boolean))];
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterShowtime('');
    setFilterMovie('');
    setFilterStatus('all');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>All Bookings</h2>
        <button onClick={clearFilters} style={{
          background: '#6c757d',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>Clear All Filters</button>
      </div>
      
      {/* Filters Section */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '25px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '12px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '12px', color: '#666' }}>Filter by Movie</label>
          <select 
            value={filterMovie} 
            onChange={(e) => setFilterMovie(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '4px' }}
          >
            <option value="">All Movies</option>
            {getUniqueMovies().map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '12px', color: '#666' }}>Filter by Date</label>
          <select 
            value={filterDate} 
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '4px' }}
          >
            <option value="">All Dates</option>
            {getUniqueDates().map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '12px', color: '#666' }}>Filter by Time</label>
          <select 
            value={filterShowtime} 
            onChange={(e) => setFilterShowtime(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '4px' }}
          >
            <option value="">All Times</option>
            {getUniqueTimes().map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        
        <div style={{ flex: 1, minWidth: '150px' }}>
          <label style={{ fontSize: '12px', color: '#666' }}>Filter by Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginTop: '4px' }}
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>
        </div>
      </div>
      
      <p style={{ marginBottom: '15px', color: '#666' }}>
        Showing {filteredBookings.length} of {bookings.length} bookings
      </p>
      
      {filteredBookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', background: '#f9f9f9', borderRadius: '8px' }}>
          <p>No bookings found</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a1a2e', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Booking ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Movie</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Theatre</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date & Time</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Seats</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Action</th>
               </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking, index) => (
                <tr key={booking._id} style={{ 
                  borderBottom: '1px solid #ddd', 
                  background: index % 2 === 0 ? '#f9f9f9' : 'white' 
                }}>
                  <td style={{ padding: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {booking.bookingId || booking._id?.slice(-8)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <strong>{booking.userId?.name || 'N/A'}</strong><br/>
                    <span style={{ fontSize: '11px', color: '#666' }}>{booking.userId?.email || 'N/A'}</span>
                  </td>
                  <td style={{ padding: '10px' }}>
                    <strong>{booking.showId?.movieId?.title || 'N/A'}</strong>
                  </td>
                  <td style={{ padding: '10px' }}>
                    {booking.showId?.theatreName || 'Main Theatre'}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {booking.showId?.date || booking.showId?.showDate}<br/>
                    <span style={{ fontSize: '11px', color: '#666' }}>{booking.showId?.time || booking.showId?.showTime}</span>
                  </td>
                  <td style={{ padding: '10px', fontSize: '14px', fontWeight: 'bold', color: '#e50914' }}>
                    {booking.seats?.join(', ')}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>₹{booking.totalPrice}</td>
                  <td style={{ padding: '10px' }}>{getStatusBadge(booking.bookingStatus)}</td>
                  <td style={{ padding: '10px' }}>
                    {booking.bookingStatus !== 'cancelled' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        style={{
                          padding: '5px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;