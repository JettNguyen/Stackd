import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import '../styles/PageHeader.css';

const PageHeader = ({ showBack = false, onBack, showProfile = false, onProfile }) => {
  const navigate = useNavigate();

  const handleBack = onBack ?? (() => navigate(-1));
  const handleProfile = onProfile ?? (() => navigate('/profile'));

  return (
    <header className="page-header">
      <div className="page-header-side page-header-side-left">
        {showBack ? (
          <button
            type="button"
            className="page-header-icon-button page-header-back-button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        ) : (
          <div className="page-header-spacer" aria-hidden="true"></div>
        )}
      </div>

      <button
        type="button"
        className="page-header-brand"
        onClick={() => navigate('/home')}
        aria-label="Go to home"
      >
        <img src={logo} alt="Stackd Logo" className="page-header-logo-image" />
        <span className="page-header-logo-text">Stackd</span>
      </button>

      <div className="page-header-side page-header-side-right">
        {showProfile ? (
          <button
            type="button"
            className="page-header-icon-button page-header-profile-button"
            onClick={handleProfile}
            aria-label="Open profile"
          >
            <FontAwesomeIcon icon={faUser} />
          </button>
        ) : (
          <div className="page-header-spacer" aria-hidden="true"></div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;