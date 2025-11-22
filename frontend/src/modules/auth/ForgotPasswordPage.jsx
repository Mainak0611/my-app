import React, { useState } from 'react';
import api from '../../lib/api';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1); 
    const [userId, setUserId] = useState('');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false); // Toggle 1
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle 2
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const res = await api.post('/api/users/forgot-password', { userId, email });
            setSuccess(res.data.message);
            setStep(2);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Verification failed.';
            setError(errorMsg);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            const res = await api.post('/api/users/reset-password', { userId, email, newPassword });
            setSuccess(res.data.message);
            setTimeout(() => { navigate('/login'); }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || 'Password reset failed.';
            setError(errorMsg);
        }
    };

    return (
        <div className="auth-page">
            {/* CSS Block Included */}
            <style>{`
                :root { --primary: #059669; --primary-hover: #047857; --text-main: #0f172a; --text-muted: #64748b; --bg-input: #f8fafc; --border: #e2e8f0; --danger: #ef4444; --success: #10b981; }
                .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle at 50% -20%, #f0fdf4 0%, #f1f5f9 100%); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; }
                .auth-card { background: white; width: 100%; max-width: 420px; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid white; }
                .auth-header { text-align: center; margin-bottom: 32px; }
                .auth-header h2 { font-size: 26px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; }
                .auth-header p { color: var(--text-muted); font-size: 14px; margin: 0; }
                .auth-form { display: flex; flex-direction: column; gap: 20px; }
                .input-group { position: relative; }
                .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
                /* Eye Button */
                .toggle-password { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px; }
                .toggle-password:hover { color: var(--text-main); }
                .auth-input { width: 100%; padding: 12px 12px 12px 40px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-input); font-size: 14px; color: var(--text-main); transition: all 0.2s; box-sizing: border-box; }
                .auth-input:focus { outline: none; border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1); }
                .auth-btn { background: var(--primary); color: white; padding: 12px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; margin-top: 8px; }
                .auth-btn:hover { background: var(--primary-hover); }
                .alert { padding: 12px; border-radius: 8px; font-size: 13px; margin-top: 16px; text-align: center; }
                .alert.error { background: #fef2f2; color: var(--danger); border: 1px solid #fecaca; }
                .alert.success { background: #ecfdf5; color: var(--success); border: 1px solid #a7f3d0; }
                .auth-footer { margin-top: 24px; text-align: center; font-size: 14px; color: var(--text-muted); }
                .auth-link { color: var(--primary); text-decoration: none; font-weight: 600; }
                .auth-link:hover { text-decoration: underline; }
            `}</style>

            <div className="auth-card">
                <div className="auth-header">
                    <h2>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
                    <p>{step === 1 ? 'Enter details to verify your identity' : 'Create a new secure password'}</p>
                </div>
                
                {step === 1 ? (
                    <form onSubmit={handleVerify} className="auth-form">
                        <div className="input-group">
                            <span className="input-icon"><Icons.User /></span>
                            <input className="auth-input" type="text" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <span className="input-icon"><Icons.Mail /></span>
                            <input className="auth-input" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <button type="submit" className="auth-btn">Verify Account</button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="auth-form">
                        <div className="input-group">
                            <span className="input-icon"><Icons.Lock /></span>
                            <input 
                                className="auth-input"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="New Password" 
                                value={newPassword} 
                                onChange={(e) => setNewPassword(e.target.value)} 
                                required 
                                minLength="6"
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowNewPassword(!showNewPassword)}>
                                {showNewPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>
                        <div className="input-group">
                            <span className="input-icon"><Icons.Lock /></span>
                            <input 
                                className="auth-input"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm New Password" 
                                value={confirmPassword} 
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                minLength="6"
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" className="toggle-password" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                            </button>
                        </div>
                        <button type="submit" className="auth-btn">Reset Password</button>
                    </form>
                )}

                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}
                
                <div className="auth-footer">
                    Remember your password? <Link to="/login" className="auth-link">Login here</Link>
                </div>
            </div>
        </div>
    );
};

const Icons = {
    User: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    Mail: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    Lock: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    Eye: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    EyeOff: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
};

export default ForgotPasswordPage;