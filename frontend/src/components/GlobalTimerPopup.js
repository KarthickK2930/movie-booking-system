import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../context/TimerContext';

const GlobalTimerPopup = () => {
  const { activeHold, timeLeft, showPopup, formatTime, clearHold } = useTimer();
  const navigate = useNavigate();

  if (!showPopup || !activeHold || timeLeft <= 0) {
    return null;
  }

  const handleClick = () => {
    // Navigate back to seat selection with the showId
    navigate(`/seats/${activeHold.showId}`);
  };

  const handleCancel = (e) => {
    e.stopPropagation();
    clearHold();
  };

  // Get seat display text
  const seatText = activeHold.seats?.length > 3 
    ? `${activeHold.seats.slice(0, 3).join(', ')} +${activeHold.seats.length - 3} more`
    : activeHold.seats?.join(', ');

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #ff9800, #f57c00)',
        color: 'white',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        zIndex: 9999,
        cursor: 'pointer',
        minWidth: '250px',
        animation: 'slideInRight 0.3s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ fontSize: '30px' }}>⏰</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Seats on Hold!</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>
            Seats: {seatText}
          </div>
        </div>
        <button
          onClick={handleCancel}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>
        Click to resume booking
      </div>
      <style>
        {`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default GlobalTimerPopup;