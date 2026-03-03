import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import logo from '../assets/logo.png';

const LoginSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', username: '', password: '' });

  useEffect(() => {
    const existingSession = localStorage.getItem('stackd_mock_session');
    if (existingSession) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const getUsers = () => {
    const users = localStorage.getItem('stackd_mock_users');
    return users ? JSON.parse(users) : [];
  };

  const setSession = (username) => {
    localStorage.setItem('stackd_mock_session', JSON.stringify({ username }));
  };

  const handleLogin = () => {
    const username = loginForm.username.trim();
    const password = loginForm.password.trim();

    if (!username || !password) {
      setMessage('Please enter username and password.');
      return;
    }

    const users = getUsers();
    const matchingUser = users.find((user) => user.username === username && user.password === password);

    if (!matchingUser) {
      setMessage('Invalid credentials.');
      return;
    }

    setSession(username);
    navigate('/home');
  };

  const handleRegister = () => {
    const email = registerForm.email.trim();
    const username = registerForm.username.trim();
    const password = registerForm.password.trim();

    if (!email || !username || !password) {
      setMessage('Please fill out all fields.');
      return;
    }

    const users = getUsers();
    const userExists = users.some((user) => user.username.toLowerCase() === username.toLowerCase());

    if (userExists) {
      setMessage('Username already exists.');
      return;
    }

    const updatedUsers = [...users, { email, username, password }];
    localStorage.setItem('stackd_mock_users', JSON.stringify(updatedUsers));
    setSession(username);
    navigate('/home');
  };

  return (
    <div className="login-signup-page">
      <div className="login-signup-header">
        <div className="logo">
          <img src={logo} alt="Stackd Logo" className="login-signup-logo-image" />
          <h1 className="login-signup-logo-text">Stackd</h1>
        </div>
      </div>
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
