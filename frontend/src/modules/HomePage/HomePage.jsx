// frontend/src/modules/HomePage/HomePage.jsx
import React from 'react';
import '../../styles/HomePage.css';

const HomePage = () => {
    return (
        <div className="home-page">
            <div className="home-content">
                <div className="welcome-section">
                    <h1>Welcome to Murti Dashboard</h1>
                    <p>Your payment tracking and management system</p>
                </div>

                <div className="dashboard-cards">
                    <div className="dashboard-card">
                        <div className="card-icon">💰</div>
                        <h3>Payment Records</h3>
                        <p>Track and manage all your payment records</p>
                        <a href="/payments" className="card-link">Go to Payments →</a>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📊</div>
                        <h3>Statistics</h3>
                        <p>View analytics and insights</p>
                        <span className="card-coming-soon">Coming Soon</span>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">📈</div>
                        <h3>Reports</h3>
                        <p>Generate and download reports</p>
                        <span className="card-coming-soon">Coming Soon</span>
                    </div>

                    <div className="dashboard-card">
                        <div className="card-icon">⚙️</div>
                        <h3>Settings</h3>
                        <p>Manage your account settings</p>
                        <span className="card-coming-soon">Coming Soon</span>
                    </div>
                </div>

                <div className="quick-stats">
                    <h2>Quick Overview</h2>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">--</div>
                            <div className="stat-label">Total Records</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">--</div>
                            <div className="stat-label">Pending Payments</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">--</div>
                            <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">--</div>
                            <div className="stat-label">This Month</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
