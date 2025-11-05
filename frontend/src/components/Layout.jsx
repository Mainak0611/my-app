// frontend/src/components/Layout.jsx
import React from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-layout">
                <Topbar />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
