import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useDelayedSpinner from '../utils/useDelayedSpinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faFolder, faGear } from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
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
  const { username: profileUsername } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingVisible = useDelayedSpinner(isLoading, 1000);
  const [feedback, setFeedback] = useState('');
  const [showMoreClasses, setShowMoreClasses] = useState(false);
  const [showMoreStacks, setShowMoreStacks] = useState(false);
  const [collapsedCardCount, setCollapsedCardCount] = useState(getCollapsedCardCount);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsMessageType, setSettingsMessageType] = useState('error');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);

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
    if (feedback && profileData) {
      const timer = setTimeout(() => {
        setFeedback('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback, profileData]);

  useEffect(() => {
    if (profileData?.account) {
      setPublicProfile(Boolean(profileData.account.publicProfile));
    }
  }, [profileData]);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const profilePath = profileUsername
          ? `/account/profile/${encodeURIComponent(profileUsername)}`
          : '/account/user';

        const response = await apiRequest(profilePath);

        if (!isMounted) return;

        if (response?.data && Array.isArray(response?.classes) && Array.isArray(response?.stacks)) {
          setProfileData({
            account: response.data,
            classes: response.classes,
            stacks: response.stacks,
            isOwnProfile: Boolean(response?.isOwnProfile),
          });
        } else {
          setFeedback('Profile data incomplete.');
        }
      } catch (error) {
        if (isMounted) {
          const isNotFoundPublicProfile = Boolean(profileUsername) && Number(error?.status) === 404;
          setProfileData(null);
          setFeedback(
            isNotFoundPublicProfile
              ? 'This account is private or does not exist.'
              : (error?.payload?.message || 'Failed to load profile.')
          );
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
  }, [profileUsername]);

  const handleLogout = () => {
    localStorage.removeItem('stackd_auth_token');
    clearAuthToken();
    navigate('/', { replace: true });
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
    setSettingsMessage('');
    setSettingsMessageType('error');
  };

  const handleRequestReset = async () => {
    if (!profileData?.account?.email) {
      setSettingsMessage('No email address is associated with this account.');
      setSettingsMessageType('error');
      return;
    }
    setSettingsLoading(true);
    setSettingsMessage('');
    try {
      const result = await apiRequest('/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email: profileData.account.email }),
      });
      setSettingsMessage(result.message || 'Reset email sent.');
      setSettingsMessageType('success');
    } catch (error) {
      setSettingsMessage(error?.payload?.message || 'Failed to send reset email.');
      setSettingsMessageType('error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTogglePublicProfile = async () => {
    const next = !publicProfile;
    setPublicProfile(next);
    try {
      await apiRequest('/account/settings', {
        method: 'PATCH',
        body: JSON.stringify({ publicProfile: next }),
      });
    } catch {
      setPublicProfile(!next);
    }
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        {isLoadingVisible ? (
          <div className="home-loading" role="status" aria-live="polite">
            <div className="home-loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : (
          <div className="profile-loading-delayed-placeholder" aria-hidden="true" />
        )}
      </div>
    );
  }

  if (!profileData) {
    const isPublicProfileView = Boolean(profileUsername);
    const emptyMessage = isPublicProfileView
      ? (feedback || 'This account is private or does not exist.')
      : (feedback || 'Sign in to view your profile.');

    return (
      <div className="profile-page">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: 'Profile' },
          ]}
        />
        <h1>Profile not found</h1>
        <p className="profile-empty">{emptyMessage}</p>
        {!isPublicProfileView && (
          <button type="button" className="profile-signin-button" onClick={() => navigate('/login')}>
            Sign In
          </button>
        )}
      </div>
    );
  }

  const { account, classes = [], stacks = [] } = profileData;
  const canEditOwnProfile = profileUsername ? Boolean(profileData?.isOwnProfile) : true;
  const profileUrl = `${window.location.origin}/profile/${account.username}`;
  const shouldShowMoreClasses = classes.length > collapsedCardCount;
  const shouldShowMoreStacks = stacks.length > collapsedCardCount;
  const visibleClasses = shouldShowMoreClasses && !showMoreClasses ? classes.slice(0, collapsedCardCount) : classes;
  const visibleStacks = shouldShowMoreStacks && !showMoreStacks ? stacks.slice(0, collapsedCardCount) : stacks;

  return (
    <div className="profile-page">
      <div className="content-appear">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: canEditOwnProfile ? 'My Profile' : `${account.username}'s Profile` },
          ]}
        />
        <div className="profile-headline">
          <div>
            <h1>{account.username}</h1>
            <p>@{account.username}</p>
          </div>
          {canEditOwnProfile && (
            <button
              type="button"
              className="profile-settings-button"
              onClick={() => setShowSettings(true)}
              aria-label="Profile settings"
            >
              <FontAwesomeIcon icon={faGear} />
            </button>
          )}
        </div>

        <div className="profile-public-card">
          <h2>Profile</h2>
          <p className="profile-meta">Joined {formatDate(account.createdAt)}</p>

          <div className="profile-field">
            <span>Classes</span>
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
            <span>Stacks</span>
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
      </div>

      <Modal isOpen={showSettings} onClose={handleCloseSettings} title="Settings">
        <div className="settings-section">
          <p className="settings-section-title">Password</p>
          <button
            type="button"
            className="settings-action-button"
            onClick={handleRequestReset}
            disabled={settingsLoading}
          >
            {settingsLoading ? 'Sending\u2026' : 'Send password reset email'}
          </button>
          {settingsMessage && (
            <p className={`settings-feedback${settingsMessageType === 'success' ? ' settings-feedback-success' : ''}`}>
              {settingsMessage}
            </p>
          )}
        </div>

        <div className="settings-section">
          <p className="settings-section-title">Privacy</p>
          <div className="settings-toggle-row">
            <div>
              <p className="settings-toggle-label">Public Profile</p>
              <p className="settings-toggle-description">Allow your stacks and classes to appear on your public profile URL</p>
            </div>
            <button
              type="button"
              className={`settings-toggle${publicProfile ? ' settings-toggle-on' : ''}`}
              onClick={handleTogglePublicProfile}
              aria-label={publicProfile ? 'Disable public profile' : 'Enable public profile'}
            />
          </div>
        </div>

        <div className="settings-section">
          <p className="settings-section-title">Account</p>
          <button type="button" className="settings-logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </Modal>

      {feedback && (
        <div className="profile-feedback-banner">
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
