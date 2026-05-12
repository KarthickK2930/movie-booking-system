import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useTimer } from '../context/TimerContext';
import LoadingSpinner from '../components/LoadingSpinner';

const SeatSelection = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { activeHold, setHold, clearHold } = useTimer();
  const [show, setShow] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const timerRef = useRef(null);

  // Check authentication
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      alert('Please login to continue');
      navigate('/login');
      return false;
    }
    
    // Set token in api headers if not already set
    if (api.defaults.headers.common['Authorization'] !== `Bearer ${token}`) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return true;
  }, [navigate]);

  const fetchShowDetails = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const response = await api.get(`/shows/${showId}`);
    const showData = response.data?.data || response.data;
    setShow(showData);

    // IMPORTANT: Check activeHold FIRST to restore seats
    if (activeHold && activeHold.showId === showId && activeHold.seats && activeHold.seats.length > 0) {
      console.log('🔄 Restoring seats from activeHold:', activeHold.seats);
      setSelectedSeats(activeHold.seats);
      
      // Also verify with backend
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const now = new Date();
      const userHolds = (showData.temporaryHolds || []).filter(h => 
        h.userId === user.id && new Date(h.expiresAt) > now
      );
      
      if (userHolds.length === 0 && activeHold.seats.length > 0) {
        // Backend doesn't have holds, refresh them
        console.log('Backend missing holds, refreshing...');
        await holdSeats(activeHold.seats);
      }
    } else {
      // No activeHold, check backend
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const now = new Date();
      const userHolds = (showData.temporaryHolds || []).filter(h => 
        h.userId === user.id && new Date(h.expiresAt) > now
      );
      const backendHeldSeats = userHolds.map(h => h.seatNumber);
      
      if (backendHeldSeats.length > 0) {
        console.log('🔄 Restoring seats from backend:', backendHeldSeats);
        setSelectedSeats(backendHeldSeats);
        setHold(showId, showData, backendHeldSeats, new Date(userHolds[0].expiresAt));
      } else {
        setSelectedSeats([]);
      }
    }

    setLoading(false);
  } catch (err) {
    console.error('Error fetching show:', err);
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
    setLoading(false);
  }
}, [showId, activeHold, setHold, navigate]);

  useEffect(() => {
    fetchShowDetails();
  }, [fetchShowDetails]);

  // Auto-refresh seats every 3 seconds
  useEffect(() => {
    if (!showId || !checkAuth()) return;
    
    const interval = setInterval(() => {
      if (!processing) {
        api.get(`/shows/${showId}`).then(response => {
          const showData = response.data?.data || response.data;
          setShow(showData);
        }).catch(err => {
          console.error('Refresh error:', err);
          if (err.response?.status === 401) {
            clearInterval(interval);
            alert('Session expired. Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        });
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [showId, processing, navigate, checkAuth]);

  const startTimer = (expiresAt) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((expiresAt - now) / 1000);
      
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        setSelectedSeats([]);
        setShowTimerPopup(false);
        clearHold();
        timerRef.current = null;
        fetchShowDetails();
        alert('⏰ Your seat hold has expired!');
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    
    timerRef.current = timer;
  };

  const holdSeats = async (seatsToHold) => {
    try {
      if (!checkAuth()) return false;
      
      const isReleasing = seatsToHold.length === 0;
      
      if (isReleasing) {
        console.log('Releasing all holds');
        await api.post('/bookings/hold', { showId, seats: [] });
        
        // Clear timer and popup
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setTimeLeft(0);
        setShowTimerPopup(false);
        clearHold();
        
        // Refresh show data to update UI
        await fetchShowDetails();
        return true;
      }
      
      console.log('Holding seats:', seatsToHold);
      const response = await api.post('/bookings/hold', { showId, seats: seatsToHold });
      const expiresAt = new Date(response.data.expiresAt);
      
      startTimer(expiresAt);
      setShowTimerPopup(true);
      setTimeout(() => setShowTimerPopup(false), 3000);
      
      setHold(showId, show, seatsToHold, expiresAt);
      
      // Refresh show data to get updated holds
      await fetchShowDetails();
      return true;
    } catch (err) {
      console.error('Hold seats error:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        alert(err.response?.data?.message || 'Failed to hold seats. Please try again.');
      }
      return false;
    }
  };

  const toggleSeat = async (seatNumber) => {
    if (!show || processing) return;
    
    // Check if seat is already booked
    if (show.bookedSeats?.includes(seatNumber)) {
      alert('This seat is already booked!');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const now = new Date();
    const activeHolds = show.temporaryHolds?.filter(h => new Date(h.expiresAt) > now) || [];
    
    // Check if seat is held by other users
    const heldByOther = activeHolds.some(h => h.seatNumber === seatNumber && h.userId !== user.id);
    if (heldByOther) {
      alert('This seat is currently being selected by another user.');
      return;
    }
    
    let newSelectedSeats;
    
    if (selectedSeats.includes(seatNumber)) {
      // DESELECT: Remove this seat
      newSelectedSeats = selectedSeats.filter(s => s !== seatNumber);
      console.log('Deselecting seat', seatNumber, 'New selection:', newSelectedSeats);
      
      // Update UI immediately
      setSelectedSeats(newSelectedSeats);
      
      if (newSelectedSeats.length === 0) {
        // No seats left - RELEASE ALL HOLDS
        console.log('No seats left, releasing all holds');
        clearHold();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          setTimeLeft(0);
          setShowTimerPopup(false);
          timerRef.current = null;
        }
        await holdSeats([]);
      } else {
        // Update hold with remaining seats - this will REPLACE all holds
        await holdSeats(newSelectedSeats);
      }
      await fetchShowDetails();
    } else {
      // SELECT: Add this seat
      if (selectedSeats.length >= 10) {
        alert('Maximum 10 seats per booking');
        return;
      }
      newSelectedSeats = [...selectedSeats, seatNumber];
      console.log('Selecting seat', seatNumber, 'New selection:', newSelectedSeats);
      setSelectedSeats(newSelectedSeats);
      await holdSeats(newSelectedSeats);
    }
  };

  const getSeatStyle = (seatNumber) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const now = new Date();
    
    const isBooked = show?.bookedSeats?.includes(seatNumber);
    const activeHolds = show?.temporaryHolds?.filter(h => new Date(h.expiresAt) > now) || [];
    const isHeldByOther = activeHolds.some(h => h.seatNumber === seatNumber && h.userId !== user.id);
    const isSelected = selectedSeats.includes(seatNumber);
    
    if (isBooked) {
      return { bg: '#cccccc', border: '#999999', color: '#666', cursor: 'not-allowed' };
    }
    if (isHeldByOther && !isSelected) {
      return { bg: '#ffcc80', border: '#ff9800', color: '#e65100', cursor: 'not-allowed' };
    }
    if (isSelected) {
      return { bg: '#90ee90', border: '#2ecc71', color: '#1a5d1a', cursor: 'pointer' };
    }
    return { bg: 'white', border: '#2ecc71', color: '#333', cursor: 'pointer' };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const confirmBooking = () => {
  if (selectedSeats.length === 0) {
    alert('Please select seats');
    return;
  }
  
  const price = show.pricePerSeat || show.price || 150;
  const totalAmount = selectedSeats.length * price;
  
  // Navigate to confirmation page
  navigate('/booking-confirm', {
    state: {
      show: show,
      selectedSeats: selectedSeats,
      totalAmount: totalAmount
    }
  });
};

  if (loading) return <LoadingSpinner />;
  if (!show) return <div style={{ textAlign: 'center', padding: 50 }}>Show not found</div>;

  const totalSeats = show.totalSeats || 50;
  let seatsPerRow = 10;
  if (totalSeats <= 50) seatsPerRow = 10;
  else if (totalSeats <= 100) seatsPerRow = 15;
  else if (totalSeats <= 200) seatsPerRow = 20;
  else if (totalSeats <= 500) seatsPerRow = 25;
  else seatsPerRow = 30;

  const rows = Math.ceil(totalSeats / seatsPerRow);
  const price = show.pricePerSeat || show.price || 150;
  const totalAmount = selectedSeats.length * price;
  const seatSize = seatsPerRow > 20 ? '35px' : '45px';

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Select Your Seats</h1>
      
      {showTimerPopup && timeLeft > 0 && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', background: '#ff9800', color: 'white',
          padding: '15px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 1000, textAlign: 'center'
        }}>
          <strong>⏰ Hold Timer</strong>
          <p style={{ fontSize: '24px', margin: '5px 0', fontWeight: 'bold' }}>{formatTime(timeLeft)}</p>
        </div>
      )}
      
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white', padding: '20px', borderRadius: '12px', marginBottom: '25px'
      }}>
        <h2>{show.movieId?.title || 'Movie'}</h2>
        <p>🏢 {show.theatreName || 'Main Theatre'}</p>
        <p>📅 {show.date} | 🕐 {show.time}</p>
        <p>💰 ₹{price} per seat</p>
        <p>💺 Total Seats: {totalSeats} | Booked: {show.bookedSeats?.length || 0}</p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ background: '#ddd', height: '5px', width: '80%', margin: '0 auto', borderRadius: '3px' }}></div>
        <p style={{ marginTop: '8px', color: '#888' }}>S C R E E N</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <div>
          {[...Array(rows)].map((_, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
              <div style={{ width: '40px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                {String.fromCharCode(65 + rowIdx)}
              </div>
              {[...Array(seatsPerRow)].map((__, colIdx) => {
                const seatNum = rowIdx * seatsPerRow + colIdx + 1;
                if (seatNum > totalSeats) return null;
                const style = getSeatStyle(seatNum);
                return (
                  <button
                    key={seatNum}
                    onClick={() => toggleSeat(seatNum)}
                    disabled={style.cursor === 'not-allowed' || processing}
                    style={{
                      width: seatSize,
                      height: seatSize,
                      margin: '3px',
                      border: `2px solid ${style.border}`,
                      borderRadius: '6px',
                      background: style.bg,
                      color: style.color,
                      cursor: style.cursor,
                      fontWeight: 'bold',
                      fontSize: '11px',
                      transition: 'all 0.2s ease'
                    }}
                    title={`Seat ${seatNum} - ₹${price}`}
                  >
                    {seatNum}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {timeLeft > 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px', padding: '10px', background: '#fff3e0', borderRadius: '8px' }}>
          <span>⏰ Your seats are on hold for: </span>
          <strong style={{ fontSize: '20px', color: '#e65100' }}>{formatTime(timeLeft)}</strong>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', margin: '25px 0', padding: '15px', background: '#f5f5f5', borderRadius: '10px', flexWrap: 'wrap' }}>
        <div><span style={{ background: 'white', border: '2px solid #2ecc71', width: '22px', height: '22px', display: 'inline-block', marginRight: '6px', borderRadius: '4px' }}></span> Available</div>
        <div><span style={{ background: '#90ee90', border: '2px solid #2ecc71', width: '22px', height: '22px', display: 'inline-block', marginRight: '6px', borderRadius: '4px' }}></span> Selected</div>
        <div><span style={{ background: '#cccccc', border: '2px solid #999', width: '22px', height: '22px', display: 'inline-block', marginRight: '6px', borderRadius: '4px' }}></span> Booked</div>
        <div><span style={{ background: '#ffcc80', border: '2px solid #ff9800', width: '22px', height: '22px', display: 'inline-block', marginRight: '6px', borderRadius: '4px' }}></span> Held by Others</div>
      </div>

      <div style={{ background: '#1a1a2e', color: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
        <h3>Booking Summary</h3>
        {selectedSeats.length > 0 ? (
          <>
            <p>Selected Seats: <strong style={{ fontSize: '18px', color: '#90ee90' }}>{selectedSeats.join(', ')}</strong></p>
            <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#e50914' }}>Total: ₹{totalAmount}</p>
          </>
        ) : (
          <p>No seats selected</p>
        )}
        <button
          onClick={confirmBooking}
          disabled={selectedSeats.length === 0 || processing}
          style={{
            marginTop: '15px',
            padding: '12px 40px',
            background: selectedSeats.length === 0 ? '#555' : '#e50914',
            border: 'none',
            borderRadius: '30px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: selectedSeats.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {processing ? 'Processing...' : `Confirm Booking (₹${totalAmount})`}
        </button>
      </div>
    </div>
  );
};

export default SeatSelection;
