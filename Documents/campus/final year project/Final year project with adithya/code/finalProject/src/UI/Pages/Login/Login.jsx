import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    twoFactorCode: '',
    inviteCode: ''
  });
  const [showTwoFactor, setShowTwoFactor] = useState(false);
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
    if (!isLogin) {
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!formData.inviteCode) {
        setError('Invite code is required for registration');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        if (!showTwoFactor) {
          if (formData.username && formData.password) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setShowTwoFactor(true);
          } else {
            setError('Please enter both username and password');
          }
        } else {
          if (formData.twoFactorCode) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('🔐 Login successful! Access granted to cybersecurity toolkit.');
          } else {
            setError('Please enter your 2FA code');
          }
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        alert('✅ Registration successful! Please check your encrypted email for verification.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(isLogin ? '🛡️ Authentication failed. Please try again.' : 'Registration failed. Please try again.');
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
          <div className="system-status">
            <div className="status-indicator online"></div>
            
          </div>
        </div>

        <div className="auth-card-dark">
          <div className="card-header-dark">
            <h2 className="auth-title">{isLogin ? 'SECURE_LOGIN' : 'REQUEST_ACCESS'}</h2>
            <div className="security-badge-dark">
              <div className="secure-pulse"></div>
              <span>ENCRYPTED_CONNECTION</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-dark">
            {error && (
              <div className="error-message-dark">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            {isLogin ? (
              !showTwoFactor ? (
                <>
                  <div className="input-group-dark">
                    <label className="input-label-dark">
                      <span className="label-icon">👤</span>
                      USERNAME
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="ENTER_USERNAME"
                      className="cyber-input"
                      required
                    />
                  </div>

                  <div className="input-group-dark">
                    <label className="input-label-dark">
                      <span className="label-icon">🔑</span>
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="ENTER_PASSWORD"
                      className="cyber-input"
                      required
                    />
                  </div>

                  <div className="form-options-dark">
                    <label className="cyber-checkbox">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      REMEMBER_ACCESS
                    </label>
                  </div>
                </>
              ) : (
                <div className="two-factor-dark">
                  <div className="two-factor-header-dark">
                    <div className="auth-icon">🔒</div>
                    <h3>2FA_REQUIRED</h3>
                  </div>
                  <p className="two-factor-desc-dark">
                    ENTER_AUTHENTICATION_CODE_FROM_YOUR_DEVICE
                  </p>
                  
                  <div className="input-group-dark">
                    <label className="input-label-dark">
                      <span className="label-icon">📱</span>
                      AUTH_CODE
                    </label>
                    <input
                      type="text"
                      name="twoFactorCode"
                      value={formData.twoFactorCode}
                      onChange={handleInputChange}
                      placeholder="000000"
                      maxLength="6"
                      className="cyber-input"
                      required
                    />
                  </div>

                  <button 
                    type="button" 
                    className="back-btn-dark"
                    onClick={() => setShowTwoFactor(false)}
                  >
                    ← BACK_TO_LOGIN
                  </button>
                </div>
              )
            ) : (
              <>
                <div className="input-group-dark">
                  <label className="input-label-dark">
                    <span className="label-icon">👤</span>
                    USERNAME
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="CHOOSE_USERNAME"
                    className="cyber-input"
                    required
                  />
                </div>

                <div className="input-group-dark">
                  <label className="input-label-dark">
                    <span className="label-icon">📧</span>
                    EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="SECURE_EMAIL"
                    className="cyber-input"
                    required
                  />
                </div>

                <div className="input-group-dark">
                  <label className="input-label-dark">
                    <span className="label-icon">🔑</span>
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="MIN_8_CHARACTERS"
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
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="VERIFY_PASSWORD"
                    className="cyber-input"
                    required
                  />
                </div>

                <div className="input-group-dark">
                  <label className="input-label-dark">
                    <span className="label-icon">🎫</span>
                    INVITE_CODE
                    <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    name="inviteCode"
                    value={formData.inviteCode}
                    onChange={handleInputChange}
                    placeholder="REQUIRED_FOR_ACCESS"
                    className="cyber-input"
                    required
                  />
                </div>

                <div className="terms-dark">
                  <label className="cyber-checkbox">
                    <input type="checkbox" required />
                    <span className="checkmark"></span>
                    ACCEPT_TERMS_AND_SECURITY_PROTOCOLS
                  </label>
                </div>
              </>
            )}

            <button 
              type="submit" 
              className={`cyber-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="cyber-spinner"></div>
                  <span className="button-text">
                    {isLogin ? (showTwoFactor ? 'VERIFYING...' : 'AUTHENTICATING...') : 'INITIALIZING_ACCESS...'}
                  </span>
                </>
              ) : (
                <span className="button-text">
                  {isLogin ? (showTwoFactor ? 'VERIFY_&_ACCESS' : 'SECURE_LOGIN') : 'REQUEST_ACCESS'}
                </span>
              )}
            </button>
          </form>

          <div className="security-panel-dark">
            <h4 className="panel-title">ACTIVE_SECURITY_MEASURES</h4>
            <div className="security-features-dark">
              <div className="feature">
                <span className="feature-icon">🔒</span>
                <span>END_TO_END_ENCRYPTION</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🛡️</span>
                <span>MULTI_FACTOR_AUTH</span>
              </div>
              <div className="feature">
                <span className="feature-icon">⚡</span>
                <span>REAL_TIME_MONITORING</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;