import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';
import Navbar from './components/Navbar';
import GlobalTimerPopup from './components/GlobalTimerPopup';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieList from './components/MovieList';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import BookingSuccess from './pages/BookingSuccess';  // ADD THIS LINE
import BookingConfirm from './pages/BookingConfirm';
import './App.css';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = React.useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <TimerProvider>
          <Navbar />
          <GlobalTimerPopup />
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <MovieList />
                </ProtectedRoute>
              } />
              <Route path="/movie/:id" element={
                <ProtectedRoute>
                  <MovieDetails />
                </ProtectedRoute>
              } />
              <Route path="/seats/:showId" element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="/booking-success" element={
                <ProtectedRoute>
                  <BookingSuccess />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/booking-confirm" element={
                <ProtectedRoute>
                  <BookingConfirm />
                </ProtectedRoute>
              } />

            </Routes>
          </div>
        </TimerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;