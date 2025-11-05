// frontend/src/modules/auth/RegisterPage.jsx
import React, { useState } from 'react';
import api from '../../lib/api';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            // Send registration data to your backend endpoint
            const res = await api.post('/api/users/register', { userId, email, password });
            
            setMessage(res.data.message || 'Registration successful! You can now log in.');
            
            // Optionally, redirect to the login page after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            
        } catch (err) {
            // Handle errors from the server (e.g., "User already exists")
            console.error('Registration error:', err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
            setError(errorMsg);
        }
    };

    return (
        <div className="auth-container">
            <h2>Register New User</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <input 
                    type="text" 
                    placeholder="User ID" 
                    value={userId} 
                    onChange={(e) => setUserId(e.target.value)} 
                    required 
                />
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit">Register</button>
            </form>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
            
            <p className="link-text">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
};

export default RegisterPage;