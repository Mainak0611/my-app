// frontend/src/lib/api.js

import axios from 'axios';

// 1. Create an Axios instance with a base URL
const api = axios.create({
  // This is the URL of your backend server
  baseURL: 'http://localhost:5001', 
  
  // You can also add other default headers here, like authentication tokens
  // headers: {
  //   'Authorization': 'Bearer YOUR_TOKEN',
  //   'Content-Type': 'application/json',
  // },
});

// 2. Export the configured instance
export default api;