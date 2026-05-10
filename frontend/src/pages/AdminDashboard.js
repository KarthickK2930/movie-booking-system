import React, { useState } from 'react';
import TheatreManager from './Admin/TheatreManager';
import ScreenManager from './Admin/ScreenManager';
import ShowManager from './Admin/ShowManager';
import AdminMovieManager from '../components/AdminMovieManager';
import AdminBookings from '../components/AdminBookings';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('theatre');

  const tabs = [
    { id: 'theatre', name: '🏢 Theatre', component: <TheatreManager /> },
    { id: 'screen', name: '📺 Screen', component: <ScreenManager /> },
    { id: 'movies', name: '🎬 Movies', component: <AdminMovieManager /> },
    { id: 'shows', name: '🎭 Schedule Shows', component: <ShowManager /> },
    { id: 'bookings', name: '📋 Bookings', component: <AdminBookings /> }
  ];

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '30px', borderBottom: '2px solid #ddd', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            style={{
              padding: '10px 20px',
              background: activeTab === tab.id ? '#1a1a2e' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#333',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div>{tabs.find(t => t.id === activeTab)?.component}</div>
    </div>
  );
};

export default AdminDashboard;