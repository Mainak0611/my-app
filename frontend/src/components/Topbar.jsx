// frontend/src/components/Topbar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Topbar.css';

const Topbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        // Clear authentication data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userId');
        
        // Dispatch custom event to notify App component
        window.dispatchEvent(new Event('logout'));
        
        // Redirect to the login page
        navigate('/login');
    };

    // Get user info from localStorage (you can also get this from context/redux)
    const userId = localStorage.getItem('userId');

    // Get page title based on current route
    const getPageTitle = () => {
        switch(location.pathname) {
            case '/':
                return 'Dashboard';
            case '/payments':
                return 'Payment Records';
            default:
                return 'Dashboard';
        }
    };

    return (
        <div className="topbar">
            <div className="topbar-left">
                <button className="topbar-home-btn" onClick={() => navigate('/')} title="Go to Dashboard">
                    <span className="home-icon">🏠</span>
                    <span className="home-text">Dashboard</span>
                </button>
                <h1 className="topbar-title">{getPageTitle()}</h1>
            </div>
            
            <div className="topbar-right">
                <div className="topbar-user">
                    <span className="topbar-user-icon">👤</span>
                    <span className="topbar-user-name">User #{userId}</span>
                </div>
                
                <button className="topbar-logout-btn" onClick={handleLogout}>
                    <span className="logout-icon">🚪</span>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Topbar;
