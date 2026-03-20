import React, { useState } from 'react';
import './Login.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    re_password: '',
    inviteCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (formData.password !== formData.re_password) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.inviteCode) {
      setError('Invite code is required for registration');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('✅ Account created successfully! Please check your email for verification.');
      // Reset form after successful registration
      setFormData({
        username: '',
        email: '',
        password: '',
        re_password: '',
        inviteCode: ''
      });
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-dark">
      <div className="auth-container-dark">
        <div className="auth-header-dark">
          <div className="logo-dark">
            <div className="cyber-logo">
              <div className="hexagon">⚡</div>
            </div>
          </div>
        </div>

        <div className="auth-card-dark">
          <div className="card-header-dark">
            <h2 className="auth-title">JOIN_THE_NETWORK</h2>
            <div className="security-badge-dark">
              <div className="secure-pulse"></div>
              <span>SECURE_REGISTRATION</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-dark">
            {error && (
              <div className="error-message-dark">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="input-group-dark">
              <label className="input-label-dark">
                <span className="label-icon">👤</span>
                CHOOSE_USERNAME
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="ENTER_YOUR_USERNAME"
                className="cyber-input"
                required
              />
            </div>

            <div className="input-group-dark">
              <label className="input-label-dark">
                <span className="label-icon">📧</span>
                EMAIL_ADDRESS
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="YOUR_SECURE_EMAIL"
                className="cyber-input"
                required
              />
            </div>

            <div className="input-group-dark">
              <label className="input-label-dark">
                <span className="label-icon">🔑</span>
                CREATE_PASSWORD
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="MINIMUM_8_CHARACTERS"
                className="cyber-input"
                required
              />
            </div>

            <div className="input-group-dark">
              <label className="input-label-dark">
                <span className="label-icon">🔒</span>
                CONFIRM_PASSWORD
              </label>
              <input
                type="password"
                name="re_password"
                value={formData.re_password}
                onChange={handleInputChange}
                placeholder="RE_ENTER_YOUR_PASSWORD"
                className="cyber-input"
                required
              />
            </div>

            <div className="input-group-dark">
              <label className="input-label-dark">
                <span className="label-icon">🎫</span>
                ACCESS_CODE
                <span className="required-star">*</span>
              </label>
              <input
                type="text"
                name="inviteCode"
                value={formData.inviteCode}
                onChange={handleInputChange}
                placeholder="ENTER_INVITATION_CODE"
                className="cyber-input"
                required
              />
            </div>

            <div className="terms-dark">
              <label className="cyber-checkbox">
                <input type="checkbox" required />
                <span className="checkmark"></span>
                I_AGREE_TO_SECURITY_PROTOCOLS_AND_TERMS
              </label>
            </div>

            <button 
              type="submit" 
              className={`cyber-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="cyber-spinner"></div>
                  <span className="button-text">CREATING_SECURE_ACCOUNT...</span>
                </>
              ) : (
                <span className="button-text">COMPLETE_REGISTRATION</span>
              )}
            </button>
          </form>

          <div className="security-panel-dark">
            <h4 className="panel-title">PROTECTION_ACTIVE</h4>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;