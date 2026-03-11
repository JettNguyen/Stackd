import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import logo from '../assets/logo.png';
import Breadcrumbs from '../components/Breadcrumbs';
import { apiRequest, getAuthToken, setAuthToken } from '../utils/api';

const LoginSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '' });

  useEffect(() => {
    if (localStorage.getItem('stackd_mock_session') || getAuthToken()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

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

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: trimUsername, password: trimPassword }),
      });

      const token = result?.token || '';
      const account = result?.data || {};
      const sessionUsername = account.username || trimUsername;

      setAuthToken(token);
      localStorage.setItem('stackd_mock_session', JSON.stringify({ username: sessionUsername }));
      upsertLocalUser(sessionUsername);
      navigate('/home');
    } catch (error) {
      setMessage(error?.message || 'Invalid credentials.');
    }
  };

  const handleRegister = async () => {
    const { email, username, password } = registerForm;
    const trimEmail = email.trim();
    const trimUsername = username.trim();
    const trimPassword = password.trim();

    if (!trimEmail || !trimUsername || !trimPassword) {
      setMessage('Please fill out all fields.');
      return;
    }

    if (!trimEmail.toLowerCase().endsWith('@ufl.edu')) {
      setMessage('Email must end with @ufl.edu.');
      return;
    }

    if (trimPassword.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    try {
      const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email: trimEmail, username: trimUsername, password: trimPassword }),
      });

      const token = result?.token || '';
      const account = result?.data || {};
      const sessionUsername = account.username || trimUsername;

      setAuthToken(token);
      localStorage.setItem('stackd_mock_session', JSON.stringify({ username: sessionUsername }));

      const users = JSON.parse(localStorage.getItem('stackd_mock_users') || '[]');
      users.push({
        email: trimEmail,
        username: sessionUsername,
        password: '',
        displayName: sessionUsername,
        bio: '',
        major: '',
        joinedAt: new Date().toISOString(),
      });
      localStorage.setItem('stackd_mock_users', JSON.stringify(users));
      navigate('/home');
    } catch (error) {
      setMessage(error?.message || 'Registration failed.');
    }
  };

  return (
    <div className="login-signup-page">
      <div className="login-signup-header">
        <div className="logo">
          <img src={logo} alt="Stackd Logo" className="login-signup-logo-image" />
          <h1 className="login-signup-logo-text">Stackd</h1>
        </div>
      </div>
      <Breadcrumbs items={[{ label: isLogin ? 'Log In' : 'Create Account' }]} />
      {isLogin ? (
        <form className="login-signup-form">
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input
              className="login-signup-form-input"
              type="text"
              value={loginForm.username}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, username: event.target.value }))}
            ></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
            ></input>
          </div>
          {message && <p className="login-signup-feedback">{message}</p>}
          <button className="login-button" type="button" onClick={handleLogin}>Log in</button>
          <button
            className="switch-button"
            type="button"
            onClick={() => {
              setMessage('');
              setIsLogin(false);
            }}
          >
            Don't have one?<br/>Create one!
          </button>
        </form>
      ) : (
        <form className="login-signup-form">
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Email</p>
            <input
              className="login-signup-form-input"
              type="email"
              value={registerForm.email}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, email: event.target.value }))}
            ></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input
              className="login-signup-form-input"
              type="text"
              value={registerForm.username}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, username: event.target.value }))}
            ></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input
              className="login-signup-form-input"
              type="password"
              value={registerForm.password}
              onChange={(event) => setRegisterForm((prev) => ({ ...prev, password: event.target.value }))}
            ></input>
          </div>
          {message && <p className="login-signup-feedback">{message}</p>}
          <button className="login-button" type="button" onClick={handleRegister}>Create Account</button>
          <button
            className="switch-button"
            type="button"
            onClick={() => {
              setMessage('');
              setIsLogin(true);
            }}
          >
            Already have one?<br/>Log in!
          </button>
        </form>
      )}
    </div>
  );
};

export default LoginSignup;
