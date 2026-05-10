import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL='https://movie-booking-system-zaxq.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;