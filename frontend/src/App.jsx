// frontend/src/App.jsx (Updated to include Register Route)
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from "./components/Header"; 
import PaymentTracker from "./modules/payments/PaymentTracker.jsx"; 
import LoginPage from './modules/auth/LoginPage.jsx';
import RegisterPage from './modules/auth/RegisterPage.jsx'; // 🛑 NEW IMPORT 🛑

function App() {
  const isAuthenticated = !!localStorage.getItem('userToken');

  // If NOT authenticated, show only the login and registration pages
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} /> {/* 🛑 NEW ROUTE 🛑 */}
          {/* Redirect all other requests to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // If authenticated, show the full application
  return (
    <Router>
      <div className="app-container">
        <Header /> 
        <main> 
          <Routes>
            <Route path="/" element={<PaymentTracker />} /> 
            <Route path="/payments" element={<PaymentTracker />} />
            {/* Add more authenticated routes here */}
            {/* Redirect back to the main app if user tries to access /login or /register while logged in */}
            <Route path="/login" element={<Navigate to="/" replace />} /> 
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} /> 
          </Routes>
        </main>
      </div>
    </Router>
  );
}
export default App;