import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import logo from '../assets/logo.png';

const LoginSignup = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="login-signup-page">
      <div class="login-signup-header">
        <div className="logo">
          <img src={logo} alt="Stackd Logo" className="login-signup-logo-image" />
          <h1 className="login-signup-logo-text">Stackd</h1>
        </div>
      </div>
      {isLogin ? (
        <form className="login-signup-form">
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input className="login-signup-form-input" type="text"></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input className="login-signup-form-input" type="text"></input>
          </div>
          <button className="login-button" type="button" onClick={() => navigate('/')}>Log in</button>
          <button className="switch-button" type="button" onClick={() => setIsLogin(false)}>Don't have one?<br/>Create one!</button>
        </form>
      ) : (
        <form className="login-signup-form">
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Email</p>
            <input className="login-signup-form-input" type="text"></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Username</p>
            <input className="login-signup-form-input" type="text"></input>
          </div>
          <div className="login-signup-form-comp">
            <p className="login-signup-form-title">Password</p>
            <input className="login-signup-form-input" type="text"></input>
          </div>
          <button className="login-button" type="button" onClick={() => navigate('/')}>Create Account</button>
          <button className="switch-button" type="button" onClick={() => setIsLogin(true)}>Already have one?<br/>Log in!</button>
        </form>
      )}
    </div>
  );
};

export default LoginSignup;
