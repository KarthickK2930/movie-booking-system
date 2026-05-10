import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTimer } from '../context/TimerContext';

const BookingConfirm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearHold } = useTimer();
  const { show, selectedSeats, totalAmount } = location.state || {};
  const [processing, setProcessing] = useState(false);

  if (!show || !selectedSeats) {
    navigate(-1);
    return null;
  }

  const price = show.pricePerSeat || show.price || 150;

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      const orderResponse = await api.post('/payments/create-order', {
        showId: show._id,
        seats: selectedSeats
      });
      
      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message);
      }
      
      const { orderId, amount, keyId } = orderResponse.data;
      
      const options = {
        key: keyId,
        amount: amount * 100,
        currency: 'INR',
        name: show?.movieId?.title || 'Movie Booking',
        description: `Seats: ${selectedSeats.join(', ')}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResponse = await api.post('/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              showId: show._id,
              seats: selectedSeats
            });
            
            if (verifyResponse.data.success) {
              // Clear the popup immediately
              clearHold();
              alert('✅ Payment Successful! Booking confirmed.');
              navigate('/my-bookings');
            } else {
              alert('Payment verification failed: ' + (verifyResponse.data.message || 'Unknown error'));
            }
          } catch (err) {
            console.error('Verification error:', err);
            alert('Payment verification failed. Please contact support.');
          }
          setProcessing(false);
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', (response) => {
        console.error('Payment failed:', response);
        alert('Payment failed: ' + response.error.description);
        setProcessing(false);
      });
      
      razorpay.open();
      
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.response?.data?.message || 'Failed to initiate payment');
      setProcessing(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>📋 Confirm Booking</h1>
      
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#e50914', marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          🎬 {show.movieId?.title}
        </h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{ width: '120px', fontWeight: 'bold' }}>🏢 Theatre:</div>
            <div>{show.theatreName || 'Main Theatre'}</div>
          </div>
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{ width: '120px', fontWeight: 'bold' }}>📅 Date:</div>
            <div>{show.date}</div>
          </div>
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{ width: '120px', fontWeight: 'bold' }}>🕐 Time:</div>
            <div>{show.time}</div>
          </div>
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{ width: '120px', fontWeight: 'bold' }}>💺 Seats:</div>
            <div><span style={{ fontSize: '18px', fontWeight: 'bold', color: '#e50914' }}>{selectedSeats.join(', ')}</span></div>
          </div>
          <div style={{ display: 'flex', marginBottom: '12px' }}>
            <div style={{ width: '120px', fontWeight: 'bold' }}>💰 Price per seat:</div>
            <div>₹{price}</div>
          </div>
        </div>
        
        <div style={{
          borderTop: '2px dashed #ddd',
          paddingTop: '15px',
          marginTop: '10px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Total Amount: <span style={{ color: '#e50914', fontSize: '28px' }}>₹{totalAmount}</span>
          </p>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={handleBack}
          style={{
            flex: 1,
            padding: '14px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ← Back
        </button>
        <button
          onClick={handlePayment}
          disabled={processing}
          style={{
            flex: 1,
            padding: '14px',
            background: '#e50914',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: processing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {processing ? 'Processing...' : `Pay ₹${totalAmount} →`}
        </button>
      </div>
      
      <p style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '20px' }}>
        Test Card: 4111 1111 1111 1111 | Expiry: 12/30 | CVV: 123
      </p>
    </div>
  );
};

export default BookingConfirm;