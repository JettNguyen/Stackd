import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('stackd_mock_session');
    navigate('/', { replace: true });
  };

  return (
    <div className="profile-page">
      <h1>Profile Page</h1>
      <p>todo</p>
      <button type="button" onClick={handleLogout}>Log out</button>
    </div>
  );
};

export default Profile;