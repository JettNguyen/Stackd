import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import logo from '../assets/logo.png';
import { apiRequest, getAuthToken, setAuthToken } from '../utils/api';

const LoginSignup = () => {
  const navigate = useNavigate();
  const authToken = getAuthToken();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', email: '' });

  useEffect(() => {
    if (authToken) {
      navigate('/home', { replace: true });
    }
  }, [navigate, authToken]);

  if (authToken) {
    return <Navigate to='/home' replace />;
  }

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
      setMessage('Please enter username and password.');
      return;
    }

    setLoading(true);
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
      setMessage('Please enter username, password, and email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
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
      setMessage(error?.payload?.message || error?.message || 'Registration failed.');
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
      {isLogin ? (
        <form key="login" className="login-signup-form" onSubmit={handleLoginSubmit}>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input
              className="login-signup-form-input"
              type="text"
              value={loginForm.username}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
              disabled={loading}
            ></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
              disabled={loading}
            ></input>
          </div>
          {message && <p className="login-signup-feedback">{message}</p>}
          {loading && <p className="login-signup-loading">Logging in...</p>}
          <button className="login-button" type="submit" disabled={loading}>Log in</button>
          <button
            className="switch-button"
            type="button"
            onClick={() => {
              setMessage('');
              setIsLogin(false);
            }}
            disabled={loading}
          >
            Don't have one?<br/>Create one!
          </button>
        </form>
      ) : (
        <form key="register" className="login-signup-form" onSubmit={handleRegisterSubmit}>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input
              className="login-signup-form-input"
              type="text"
              value={registerForm.username}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
              disabled={loading}
            ></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Email</p>
            <input
              className="login-signup-form-input"
              type="email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
              disabled={loading}
            ></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
              disabled={loading}
            ></input>
          </div>
          {message && <p className="login-signup-feedback">{message}</p>}
          {loading && <p className="login-signup-loading">Creating account...</p>}
          <button className="login-button" type="submit" disabled={loading}>Create Account</button>
          <button
            className="switch-button"
            type="button"
            onClick={() => {
              setMessage('');
              setIsLogin(true);
            }}
            disabled={loading}
          >
            Already have one?<br/>Log in!
          </button>
        </form>
      )}
    </div>
  );
};

export default LoginSignup;
