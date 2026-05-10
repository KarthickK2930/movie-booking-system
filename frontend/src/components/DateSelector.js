import React from 'react';

const DateSelector = ({ availableDates, selectedDate, onDateSelect }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()]
    };
  };

  // Generate next 10 days if no available dates
  const generateNext10Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const datesToShow = availableDates.length > 0 ? availableDates : generateNext10Days();

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      overflowX: 'auto',
      padding: '10px 0',
      marginBottom: '30px',
      scrollbarWidth: 'thin'
    }}>
      {datesToShow.map(date => {
        const formatted = formatDate(date);
        const isSelected = selectedDate === date;
        const hasShows = availableDates.includes(date);
        
        return (
          <button
            key={date}
            onClick={() => onDateSelect(date)}
            disabled={!hasShows && availableDates.length > 0}
            style={{
              minWidth: '80px',
              padding: '12px',
              background: isSelected ? '#e50914' : (hasShows || availableDates.length === 0 ? 'white' : '#f0f0f0'),
              color: isSelected ? 'white' : (hasShows || availableDates.length === 0 ? '#333' : '#999'),
              border: `1px solid ${isSelected ? '#e50914' : '#ddd'}`,
              borderRadius: '8px',
              cursor: (hasShows || availableDates.length === 0) ? 'pointer' : 'not-allowed',
              textAlign: 'center',
              transition: 'all 0.3s',
              opacity: (hasShows || availableDates.length === 0) ? 1 : 0.5
            }}
          >
            <div style={{ fontSize: '14px' }}>{formatted.day}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatted.date}</div>
            <div style={{ fontSize: '12px' }}>{formatted.month}</div>
          </button>
        );
      })}
    </div>
  );
};

export default DateSelector;