import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTimer } from '../context/TimerContext';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/my');
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
      setLoading(false);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      setBookings([]);
      setLoading(false);
    }
  };

  const { clearHold } = useTimer();

  const cancelBooking = async (bookingId) => {
  if (!window.confirm('Are you sure you want to cancel this booking?')) return;
  
  setCancelling(bookingId);
  try {
    await api.delete(`/bookings/${bookingId}`);
    alert('Booking cancelled successfully!');
    clearHold();  // Clear popup if exists
    fetchBookings();
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to cancel booking');
  } finally {
    setCancelling(null);
  }
};

  if (loading) return <LoadingSpinner />;

  if (!bookings || bookings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>No Bookings Yet</h2>
        <p>Go to movies and book your first ticket! 🎬</p>
      </div>
    );
  }

  return (
    <div>
      <h1>My Bookings</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {bookings.map((booking) => (
          <div key={booking._id} style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '20px',
            background: 'white',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: '#1a1a2e', marginBottom: '10px' }}>{booking.showId?.movieId?.title || 'Movie'}</h3>
                <p><strong>🏢 Theatre:</strong> {booking.showId?.theatreName || 'Main Theatre'}</p>
                <p><strong>🕐 Show Time:</strong> {booking.showId?.time || 'N/A'}</p>
                <p><strong>📅 Date:</strong> {booking.showId?.date || 'N/A'}</p>
                <p><strong>💺 Seats:</strong> <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e50914' }}>{booking.seats?.join(', ')}</span></p>
                <p><strong>💰 Total Amount:</strong> ₹{booking.totalPrice || 0}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  <strong>Booked on:</strong> {new Date(booking.createdAt).toLocaleString()}
                </p>
                <p style={{ marginTop: '8px' }}>
                  <span style={{
                    background: booking.bookingStatus === 'cancelled' ? '#dc3545' : '#28a745',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>
                    {booking.bookingStatus === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}
                  </span>
                </p>
              </div>
              
              {booking.bookingStatus !== 'cancelled' && (
                <button
                  onClick={() => cancelBooking(booking._id)}
                  disabled={cancelling === booking._id}
                  style={{
                    padding: '10px 20px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: cancelling === booking._id ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {cancelling === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
              
              {booking.bookingStatus === 'cancelled' && (
                <span style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  Cancelled
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyBookings;