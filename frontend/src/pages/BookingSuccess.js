import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking } = location.state || {};

  if (!booking) {
    navigate('/');
    return null;
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      {/* Success Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '60px', marginBottom: '10px' }}>🎉</div>
        <h1 style={{ color: '#28a745', marginBottom: '5px' }}>Booking Confirmed!</h1>
        <p>Your tickets have been booked successfully.</p>
      </div>

      {/* Ticket Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        {/* Ticket Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: 0 }}>{booking.showId?.movieId?.title}</h2>
          <p style={{ margin: '5px 0 0', opacity: 0.8 }}>🎬 Movie Ticket</p>
        </div>

        {/* Ticket Body */}
        <div style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 0', fontWeight: 'bold', width: '40%' }}>Booking ID:</td>
                <td style={{ padding: '10px 0' }}>{booking.bookingId || booking._id}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Theatre:</td>
                <td style={{ padding: '10px 0' }}>{booking.showId?.theatreName || 'Main Theatre'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Date:</td>
                <td style={{ padding: '10px 0' }}>{formatDate(booking.showId?.date)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Time:</td>
                <td style={{ padding: '10px 0' }}>{booking.showId?.time}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Seats:</td>
                <td style={{ padding: '10px 0', fontSize: '18px', fontWeight: 'bold', color: '#e50914' }}>
                  {booking.seats?.join(', ')}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', fontWeight: 'bold' }}>Total Paid:</td>
                <td style={{ padding: '10px 0', fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                  ₹{booking.totalPrice}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Ticket Footer */}
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          textAlign: 'center',
          borderTop: '2px dashed #ddd'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            Please arrive 15 minutes before show time.<br/>
            Show this ticket at the entrance.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '10px 24px',
            background: '#1a1a2e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🖨️ Print Ticket
        </button>
        <button
          onClick={() => navigate('/my-bookings')}
          style={{
            padding: '10px 24px',
            background: '#e50914',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          📋 My Bookings
        </button>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🎬 Book More
        </button>
      </div>
    </div>
  );
};

export default BookingSuccess;