import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Shield } from 'lucide-react';
import api from '../services/api';
import './Login.css';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('9999999999');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/send-otp', { phoneNumber });
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/verify-otp', { phoneNumber, otp });
      if (res.data.data.role !== 'admin') {
        setError('Access denied. This portal is for administrators only.');
        return;
      }
      localStorage.setItem('adminToken', res.data.data.accessToken);
      localStorage.setItem('adminRefreshToken', res.data.data.refreshToken);
      localStorage.setItem('adminData', JSON.stringify(res.data.data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-circ-lg">GS</div>
          <h1>Admin Portal</h1>
          <p>Sign in to manage GharSeva Platform</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="login-form">
          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-wrapper">
              <Shield size={20} color="#94A3B8" />
              <input 
                type="tel" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9999999999"
                required
                disabled={otpSent}
              />
            </div>
          </div>

          {otpSent && (
            <div className="form-group animate-slide-up">
              <label>Enter 6-Digit OTP</label>
              <div className="input-wrapper">
                <Lock size={20} color="#94A3B8" />
                <input 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : <span>{otpSent ? 'Verify & Enter' : 'Get Secret Code'}</span>}
          </button>
          
          {otpSent && (
            <button type="button" className="btn-text mt-2" onClick={() => setOtpSent(false)}>
              Change Phone Number
            </button>
          )}
        </form>

        <div className="login-footer">
          <Shield size={14} />
          <span>Secure Administrator Access Only</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
