import React, { useState } from 'react';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State for toggle

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/api/users/login', { userId, password });
            localStorage.setItem('userToken', res.data.token);
            localStorage.setItem('userId', res.data.userId);
            localStorage.setItem('userName', res.data.userName);
            toast.success('Login successful! Redirecting...');
            setTimeout(() => { window.location.href = '/'; }, 1000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Login failed.';
            toast.error(errorMsg);
        }
    };

    return (
        <div className="auth-layout">
            <ToastContainer position="top-right" theme="light" />
            
            <style>{`
                :root {
                    --bg-body: #f8fafc;
                    --bg-card: #ffffff;
                    --text-main: #0f172a;
                    --text-muted: #64748b;
                    --border: #e2e8f0;
                    --primary: #059669;
                    --primary-hover: #047857;
                }

                .auth-layout {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--bg-body);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    padding: 20px;
                    position: relative;
                }

                .auth-layout::before {
                    content: ''; position: absolute; width: 100%; height: 100%;
                    background: radial-gradient(circle at 50% 0%, rgba(5, 150, 105, 0.05) 0%, transparent 500px);
                    pointer-events: none;
                }

                .auth-card {
                    background: var(--bg-card);
                    width: 100%;
                    max-width: 400px;
                    padding: 40px;
                    border-radius: 24px;
                    border: 1px solid var(--border);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    position: relative;
                    z-index: 1;
                }

                .brand-header { text-align: center; margin-bottom: 32px; }
                .brand-title { font-size: 28px; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.5px; }
                .brand-subtitle { font-size: 14px; color: var(--text-muted); margin-top: 8px; }

                .form-group { margin-bottom: 20px; }
                
                /* Wrapper for password input to position eye icon */
                .input-wrapper { position: relative; }

                .form-input {
                    width: 100%; padding: 12px 16px; border: 1px solid var(--border); border-radius: 12px;
                    font-size: 15px; color: var(--text-main); background: #f8fafc;
                    transition: all 0.2s; box-sizing: border-box;
                }
                .form-input:focus {
                    outline: none; border-color: var(--primary); background: white;
                    box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
                }
                
                /* Eye Button Style */
                .toggle-password {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: var(--text-muted);
                    display: flex;
                    align-items: center;
                    padding: 4px;
                }
                .toggle-password:hover { color: var(--text-main); }

                .btn-submit {
                    width: 100%; padding: 14px; background: var(--primary); color: white;
                    border: none; border-radius: 12px; font-weight: 600; font-size: 15px;
                    cursor: pointer; margin-top: 10px; transition: background 0.2s;
                }
                .btn-submit:hover { background: var(--primary-hover); }

                .auth-footer { margin-top: 24px; text-align: center; font-size: 14px; color: var(--text-muted); display: flex; flex-direction: column; gap: 12px; }
                .auth-link { color: var(--primary); text-decoration: none; font-weight: 600; }
                .auth-link:hover { text-decoration: underline; }
            `}</style>

            <div className="auth-card">
                <div className="brand-header">
                    <h1 className="brand-title">Murti</h1>
                    <p className="brand-subtitle">Welcome back! Please login.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input 
                            className="form-input"
                            type="text" 
                            placeholder="User ID" 
                            value={userId} 
                            onChange={(e) => setUserId(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <div className="input-wrapper">
                            <input 
                                className="form-input"
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                                style={{ paddingRight: '40px' }} // Space for eye icon
                            />
                            <button 
                                type="button" 
                                className="toggle-password"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn-submit">Sign In</button>
                </form>
                
                <div className="auth-footer">
                    <div><Link to="/forgot-password" class="auth-link">Forgot Password?</Link></div>
                    <div>Don't have an account? <Link to="/register" className="auth-link">Create one</Link></div>
                </div>
            </div>
        </div>
    );
};

const Icons = {
    Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    EyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
};

export default LoginPage;