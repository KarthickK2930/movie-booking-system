import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#1a1a2e',
      padding: '1rem',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem' }}>
        🎬 BookMyShow Clone
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Movies</Link>
        
        {user && (
          <>
            <Link to="/my-bookings" style={{ color: 'white', textDecoration: 'none' }}>My Bookings</Link>
            {user.role === 'admin' && (
              <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin Panel</Link>
            )}
          </>
        )}
        
        {user ? (
          <>
            <span>👤 {user.name}</span>
            <button onClick={handleLogout} style={{
              background: 'red',
              color: 'white',
              border: 'none',
              padding: '0.3rem 0.8rem',
              cursor: 'pointer'
            }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;