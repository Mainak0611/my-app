// frontend/src/modules/auth/LoginPage.jsx (Updated with Register Link)
import React, { useState } from 'react';
import api from '../../lib/api';
import { Link } from 'react-router-dom'; // 🛑 Ensure Link is imported 🛑
import '../../styles/AuthForm.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/api/users/login', { email, password });
            
            // Store the token and user ID
            localStorage.setItem('userToken', res.data.token);
            localStorage.setItem('userId', res.data.userId);

            // Redirect to the main application page
            window.location.href = '/'; 
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Check credentials.');
        }
    };

    return (
        <div className="auth-container">
            <h2>User Login</h2>
            <form onSubmit={handleSubmit} className="auth-form">
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
                <button type="submit">Login</button>
            </form>
            {error && <p className="error-message">{error}</p>}
            
            {/* 🛑 LINK TO REGISTRATION PAGE 🛑 */}
            <p className="link-text">
                Need an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
};

export default LoginPage;