import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const [activeHold, setActiveHold] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const timerRef = useRef(null);

  // Load saved hold from localStorage on app start
  useEffect(() => {
    const savedHold = localStorage.getItem('activeSeatHold');
    if (savedHold) {
      try {
        const hold = JSON.parse(savedHold);
        const expiryTime = new Date(hold.expiresAt);
        const now = new Date();
        
        if (expiryTime > now) {
          setActiveHold(hold);
          setShowPopup(true);
          startTimer(expiryTime);
        } else {
          localStorage.removeItem('activeSeatHold');
        }
      } catch (e) {
        console.error('Error loading saved hold:', e);
        localStorage.removeItem('activeSeatHold');
      }
    }
  }, []);

  const startTimer = (expiresAt) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((expiresAt - now) / 1000);
      
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        setShowPopup(false);
        setActiveHold(null);
        localStorage.removeItem('activeSeatHold');
        timerRef.current = null;
      } else {
        setTimeLeft(diff);
      }
    }, 1000);
    
    timerRef.current = timer;
  };

  const setHold = (showId, showData, seats, expiresAt) => {
    const holdData = {
      showId,
      showData: {
        movieId: showData?.movieId,
        theatreName: showData?.theatreName,
        date: showData?.date,
        time: showData?.time,
        price: showData?.pricePerSeat || showData?.price
      },
      seats: seats,  // Store selected seats
      expiresAt: expiresAt.toISOString()
    };
    
    setActiveHold(holdData);
    setShowPopup(true);
    localStorage.setItem('activeSeatHold', JSON.stringify(holdData));
    startTimer(expiresAt);
  };

  const clearHold = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setActiveHold(null);
    setTimeLeft(0);
    setShowPopup(false);
    localStorage.removeItem('activeSeatHold');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TimerContext.Provider value={{
      activeHold,
      timeLeft,
      showPopup,
      setHold,
      clearHold,
      formatTime
    }}>
      {children}
    </TimerContext.Provider>
  );
};