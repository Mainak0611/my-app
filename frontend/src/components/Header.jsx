// frontend/src/components/Header.jsx

import React from 'react';
// Assuming you want to reuse or adapt the title style from App.css

const Header = () => {
    return (
        // Use a standard semantic header tag
        <header style={{
            padding: '20px 0',
            textAlign: 'center',
            borderBottom: '1px solid #ddd',
            marginBottom: '20px'
        }}>
            {/* The main title, consistent with the rest of the app */}
            <h1 className="payment-title" style={{ margin: 0 }}>
                Application Dashboard
            </h1>
            {/* You could add navigation links here for future modules (e.g., Home, Inventory, Clients) */}
        </header>
    );
};

export default Header;