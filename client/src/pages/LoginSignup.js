import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import './LoginSignup.css';
import logo from '../assets/logo.png';
import { apiRequest, getAuthToken, setAuthToken } from '../utils/api';

const LoginSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get('token') || '';

  const authToken = getAuthToken();
  const [mode, setMode] = useState(() => (resetToken ? 'reset' : 'login'));
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', email: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetForm, setResetForm] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    if (authToken) {
      navigate('/home', { replace: true });
    }
  }, [navigate, authToken]);

  if (authToken) {
    return <Navigate to='/home' replace />;
  }

  const feedbackClassName = `login-signup-feedback${messageType === 'success' ? ' login-signup-feedback-success' : ''}`;

  const switchMode = (next) => {
    setMessage('');
    setMessageType('error');
    setMode(next);
  };

  const upsertLocalUser = (username) => {
    const users = JSON.parse(localStorage.getItem('stackd_mock_users') || '[]');
    const hasUser = users.some((user) => user.username.toLowerCase() === username.toLowerCase());

    if (!hasUser) {
      users.push({
        email: '',
        username,
        password: '',
        displayName: username,
        bio: '',
        major: '',
        joinedAt: new Date().toISOString(),
      });
      localStorage.setItem('stackd_mock_users', JSON.stringify(users));
    }
  };

  const handleLogin = async () => {
    const { username, password } = loginForm;
    const trimUsername = username.trim();
    const trimPassword = password.trim();

    if (!trimUsername || !trimPassword) {
      setMessageType('error');
      setMessage('Please enter username and password.');
      return;
    }

    setLoading(true);
    setMessageType('error');
    setMessage('');
    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: trimUsername, password: trimPassword }),
      });

      const token = result?.token || '';
      const account = result?.data || {};
      const sessionUsername = account.username || trimUsername;

      setAuthToken(token);
      upsertLocalUser(sessionUsername);
      navigate('/home');
    } catch (error) {
      setMessageType('error');
      setMessage(error?.payload?.message || error?.message || 'Incorrect username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const { username, password, email } = registerForm;
    const trimUsername = username.trim();
    const trimPassword = password.trim();
    const trimEmail = email.trim().toLowerCase();

    if (!trimUsername || !trimPassword || !trimEmail) {
      setMessageType('error');
      setMessage('Please enter username, password, and email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setMessageType('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setMessageType('error');
    setMessage('');
    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: trimUsername, password: trimPassword, email: trimEmail }),
      });

      const token = result?.token || '';
      const account = result?.data || {};
      const sessionUsername = account.username || trimUsername;

      setAuthToken(token);
      upsertLocalUser(sessionUsername);
      navigate('/home');
    } catch (error) {
      setMessageType('error');
      setMessage(error?.payload?.message || error?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (event) => {
    event.preventDefault();
    const trimEmail = forgotEmail.trim().toLowerCase();

    if (!trimEmail) {
      setMessageType('error');
      setMessage('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setMessageType('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setMessageType('error');
    setMessage('');
    try {
      const result = await apiRequest('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email: trimEmail }),
      });
      setMessageType('success');
      setMessage(result?.message || `Reset link sent to ${trimEmail}. Check your inbox and junk/spam folder.`);
    } catch (error) {
      setMessageType('error');
      setMessage(error?.payload?.message || error?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    const { password, confirmPassword } = resetForm;

    if (!password) {
      setMessageType('error');
      setMessage('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setMessageType('error');
      setMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setMessageType('error');
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setMessageType('error');
    setMessage('');
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, password }),
      });
      setMessageType('success');
      setMessage('Password reset! You can now log in.');
      setTimeout(() => switchMode('login'), 1500);
    } catch (error) {
      setMessageType('error');
      setMessage(error?.payload?.message || error?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    handleLogin();
  };

  const handleRegisterSubmit = (event) => {
    event.preventDefault();
    handleRegister();
  };

  return (
    <div className="login-signup-page">
      <div className="login-signup-header">
        <div className="login-signup-brand">
          <img src={logo} alt="Stackd Logo" className="login-signup-logo-image" />
          <h1 className="login-signup-logo-text">Stackd</h1>
        </div>
      </div>

      {mode === 'login' && (
        <form key="login" className="login-signup-form" onSubmit={handleLoginSubmit}>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input
              className="login-signup-form-input"
              type="text"
              value={loginForm.username}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              disabled={loading}
            />
          </div>
          {message && <p className={feedbackClassName}>{message}</p>}
          {loading && <p className="login-signup-loading">Logging in...</p>}
          <button className="login-button" type="submit" disabled={loading}>Log in</button>
          <button
            className="switch-button"
            type="button"
            onClick={() => switchMode('register')}
            disabled={loading}
          >
            Don't have one?<br/>Create one!
          </button>
          <button
            className="login-forgot-link"
            type="button"
            onClick={() => switchMode('forgot')}
            disabled={loading}
          >
            Forgot password?
          </button>
        </form>
      )}

      {mode === 'register' && (
        <form key="register" className="login-signup-form" onSubmit={handleRegisterSubmit}>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input
              className="login-signup-form-input"
              type="text"
              value={registerForm.username}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Email</p>
            <input
              className="login-signup-form-input"
              type="email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
              disabled={loading}
            />
          </div>
          {message && <p className={feedbackClassName}>{message}</p>}
          {loading && <p className="login-signup-loading">Creating account...</p>}
          <button className="login-button" type="submit" disabled={loading}>Create Account</button>
          <button
            className="switch-button"
            type="button"
            onClick={() => switchMode('login')}
            disabled={loading}
          >
            Already have one?<br/>Log in!
          </button>
        </form>
      )}

      {mode === 'forgot' && (
        <form key="forgot" className="login-signup-form" onSubmit={handleForgot}>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Email</p>
            <input
              className="login-signup-form-input"
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          {message && <p className={feedbackClassName}>{message}</p>}
          {loading && <p className="login-signup-loading">Sending...</p>}
          <button className="login-button" type="submit" disabled={loading}>
            Send Reset Link
          </button>
          <button
            className="switch-button"
            type="button"
            onClick={() => switchMode('login')}
            disabled={loading}
          >
            Back to Log in
          </button>
        </form>
      )}

      {mode === 'reset' && (
        <form key="reset" className="login-signup-form" onSubmit={handleReset}>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">New Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={resetForm.password}
              onChange={(e) => setResetForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={loading}
            />
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Confirm Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={resetForm.confirmPassword}
              onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              disabled={loading}
            />
          </div>
          {message && <p className={feedbackClassName}>{message}</p>}
          {loading && <p className="login-signup-loading">Resetting...</p>}
          <button className="login-button" type="submit" disabled={loading}>
            Set New Password
          </button>
          <button
            className="switch-button"
            type="button"
            onClick={() => switchMode('login')}
            disabled={loading}
          >
            Back to Log in
          </button>
        </form>
      )}
    </div>
  );
};

export default LoginSignup;
