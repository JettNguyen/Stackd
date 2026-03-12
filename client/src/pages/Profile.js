import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faFolder } from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../components/Breadcrumbs';
import PageHeader from '../components/PageHeader';
import { apiRequest, clearAuthToken } from '../utils/api';
import './Home.css';
import './Profile.css';

const getCollapsedCardCount = () => {
  if (typeof window === 'undefined') {
    return 3;
  }

  if (window.innerWidth >= 1250) {
    return 7;
  }

  if (window.innerWidth >= 650) {
    return 5;
  }

  return 3;
};

const formatDate = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently';
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showMoreClasses, setShowMoreClasses] = useState(false);
  const [showMoreStacks, setShowMoreStacks] = useState(false);
  const [collapsedCardCount, setCollapsedCardCount] = useState(getCollapsedCardCount);

  useEffect(() => {
    const updateCollapsedCardCount = () => {
      setCollapsedCardCount(getCollapsedCardCount());
    };

    window.addEventListener('resize', updateCollapsedCardCount);

    return () => {
      window.removeEventListener('resize', updateCollapsedCardCount);
    };
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('stackd_auth_token');

        if (!token) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        const response = await apiRequest('/account/user');

        if (!isMounted) return;

        if (response?.data && Array.isArray(response?.classes) && Array.isArray(response?.stacks)) {
          setProfileData({
            account: response.data,
            classes: response.classes,
            stacks: response.stacks,
          });
        } else {
          setFeedback('Profile data incomplete.');
        }
      } catch (error) {
        if (isMounted) {
          setFeedback('Failed to load profile. Please sign in again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('stackd_auth_token');
    clearAuthToken();
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <PageHeader showBack />

        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: 'Profile' },
          ]}
        />

        <div className="home-loading" role="status" aria-live="polite">
          <div className="home-loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-page">
        <PageHeader showBack />

        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: 'Profile' },
          ]}
        />
        <h1>Profile not found</h1>
        <p className="profile-empty">Sign in to view your profile.</p>
        <div className="profile-actions">
          <button type="button" onClick={() => navigate('/home')}>
            Back to Home
          </button>
          <button type="button" style={{ backgroundColor: 'var(--accent-color)' }} onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const { account, classes = [], stacks = [] } = profileData;
  const profileUrl = `${window.location.origin}/profile/${account.username}`;
  const shouldShowMoreClasses = classes.length > collapsedCardCount;
  const shouldShowMoreStacks = stacks.length > collapsedCardCount;
  const visibleClasses = shouldShowMoreClasses && !showMoreClasses ? classes.slice(0, collapsedCardCount) : classes;
  const visibleStacks = shouldShowMoreStacks && !showMoreStacks ? stacks.slice(0, collapsedCardCount) : stacks;

  return (
    <div className="profile-page">
      <PageHeader showBack />

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: 'My Profile' },
        ]}
      />

      <div className="profile-headline">
        <h1>{account.username}</h1>
        <p>@{account.username}</p>
      </div>

      <div className="profile-public-card">
        <h2>Profile</h2>
        <p className="profile-meta">Joined {formatDate(account.createdAt)}</p>

        <div className="profile-field">
          <span>Your Classes</span>
          {classes.length > 0 ? (
            <div className={`cards-grid profile-cards-grid ${showMoreClasses ? 'show-all' : ''}`}>
              {visibleClasses.map((item) => (
                <div
                  key={item._id}
                  className="class-card"
                  onClick={() => navigate(`/class/${item._id}`)}
                >
                  <div className="folder-wrapper">
                    <FontAwesomeIcon icon={faFolder} className="folder-icon" />
                    {item.stackCount > 0 && <span className="stack-badge">{item.stackCount}</span>}
                  </div>
                  <span className="class-name">{item.name}</span>
                </div>
              ))}
              {shouldShowMoreClasses && (
                <button className="see-more-button" onClick={() => setShowMoreClasses((prev) => !prev)}>
                  <FontAwesomeIcon icon={showMoreClasses ? faArrowLeft : faArrowRight} className="arrow-icon" />
                  <span>{showMoreClasses ? 'see less' : 'see more'}</span>
                </button>
              )}
            </div>
          ) : (
            <p className="profile-empty">None yet</p>
          )}
        </div>

        <div className="profile-field">
          <span>Your Stacks</span>
          {stacks.length > 0 ? (
            <div className={`cards-grid profile-cards-grid ${showMoreStacks ? 'show-all' : ''}`}>
              {visibleStacks.map((item) => (
                <div
                  key={item._id}
                  className="stack-card"
                  onClick={() => navigate(`/stack/${item._id}`)}
                >
                  <div className="stack-layer-back"></div>
                  <div className="stack-layer-middle"></div>
                  <div className="stack-layer-front">
                    <div className="stack-content">
                      <span className="stack-name">{item.name}</span>
                      {item.className && <span className="stack-class-label">{item.className}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {shouldShowMoreStacks && (
                <button className="see-more-button" onClick={() => setShowMoreStacks((prev) => !prev)}>
                  <FontAwesomeIcon icon={showMoreStacks ? faArrowLeft : faArrowRight} className="arrow-icon" />
                  <span>{showMoreStacks ? 'see less' : 'see more'}</span>
                </button>
              )}
            </div>
          ) : (
            <p className="profile-empty">None yet</p>
          )}
        </div>

        <div className="profile-field">
          <span>Public URL</span>
          <p className="profile-url">{profileUrl}</p>
        </div>
      </div>

      <div className="profile-actions">
        <button type="button" onClick={() => navigate('/home')}>
          Back to Home
        </button>
        <button type="button" className="profile-logout-button" onClick={handleLogout}>
          Log out
        </button>
      </div>

      {feedback && (
        <div className="profile-feedback-banner">
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;