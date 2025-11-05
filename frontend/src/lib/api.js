// frontend/src/lib/api.js

import axios from 'axios';

// 1. Create an Axios instance with a base URL
const api = axios.create({
  // This is the URL of your backend server
  baseURL: 'http://localhost:5001', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🛑 2. ADD A REQUEST INTERCEPTOR TO ATTACH THE JWT TOKEN 🛑
api.interceptors.request.use(
  (config) => {
    // Get the user token from local storage
    const token = localStorage.getItem('userToken');

    // If the token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// 3. Optional: Add a response interceptor to handle 401 errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If the server returns a 401 Unauthorized error (token expired/invalid)
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or token is invalid. Clearing credentials and redirecting to login.");
            
            // Clear credentials and force a logout/redirect to login
            localStorage.removeItem('userToken');
            localStorage.removeItem('userId');
            
            // Redirect to login page with a full page refresh
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);


// 4. Export the configured instance
export default api;