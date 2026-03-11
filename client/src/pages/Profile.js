import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faFolder, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import {
  getPublicProfileData,
  normalizeUsersForProfile,
  saveUsers,
} from '../utils/mockData';
import Breadcrumbs from '../components/Breadcrumbs';
import { apiRequest, clearAuthToken } from '../utils/api';
import './Home.css';
import './Profile.css';

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
  const { username: routeUsername } = useParams();
  const [users, setUsers] = useState([]);
  const [sessionUsername, setSessionUsername] = useState('');
  const [form, setForm] = useState({
    displayName: '',
    bio: '',
    major: '',
  });
  const [publicData, setPublicData] = useState({ classes: [], stacks: [] });
  const [editingField, setEditingField] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showMoreClasses, setShowMoreClasses] = useState(false);
  const [showMoreStacks, setShowMoreStacks] = useState(false);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  useEffect(() => {
    const normalizedUsers = normalizeUsersForProfile();
    setUsers(normalizedUsers);

    try {
      const session = JSON.parse(localStorage.getItem('stackd_mock_session') || '{}');
      setSessionUsername(session.username || '');
    } catch {
      setSessionUsername('');
    }
  }, [routeUsername]);

  useEffect(() => {
    if (!sessionUsername) {
      return;
    }

    let isMounted = true;

    const syncAccount = async () => {
      try {
        const response = await apiRequest('/account/user');
        const account = response?.data;
        if (!account || !isMounted) {
          return;
        }

        setUsers((prev) => {
          const exists = prev.some(
            (user) => user.username.toLowerCase() === String(account.username).toLowerCase()
          );

          const next = exists
            ? prev
            : [
                ...prev,
                {
                  email: account.email || '',
                  username: account.username,
                  password: '',
                  displayName: account.username,
                  bio: '',
                  major: '',
                  joinedAt: account.createdAt || new Date().toISOString(),
                },
              ];

          saveUsers(next);
          return next;
        });
      } catch {
        // Keep local profile fallback when backend profile fields are unavailable.
      }
    };

    syncAccount();

    return () => {
      isMounted = false;
    };
  }, [sessionUsername]);

  const profileUsername = routeUsername || sessionUsername;

  useEffect(() => {
    if (!profileUsername) {
      setPublicData({ classes: [], stacks: [] });
      return;
    }

    setPublicData(getPublicProfileData(profileUsername));
  }, [profileUsername]);

  const activeUser = useMemo(
    () => users.find((user) => user.username.toLowerCase() === profileUsername.toLowerCase()),
    [users, profileUsername]
  );

  const isOwner = Boolean(
    activeUser &&
      sessionUsername &&
      activeUser.username.toLowerCase() === sessionUsername.toLowerCase()
  );

  useEffect(() => {
    if (!activeUser) {
      return;
    }

    setForm({
      displayName: activeUser.displayName,
      bio: activeUser.bio,
      major: activeUser.major,
    });
  }, [activeUser]);

  const handleLogout = () => {
    localStorage.removeItem('stackd_mock_session');
    clearAuthToken();
    navigate('/', { replace: true });
  };

  const handleSaveField = (field) => {
    if (!activeUser) {
      return;
    }

    const nextValue = form[field]?.trim() ?? '';
    if (field === 'displayName' && !nextValue) {
      setFeedback('Display name is required.');
      return;
    }

    const updatedUsers = users.map((user) => {
      if (user.username.toLowerCase() !== activeUser.username.toLowerCase()) {
        return user;
      }

      return {
        ...user,
        [field]: nextValue,
      };
    });

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setEditingField('');
    setFeedback('Profile updated.');
  };

  if (!activeUser) {
    return (
      <div className="profile-page">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: 'Profile' },
          ]}
        />
        <h1>Profile not found</h1>
        <p className="profile-empty">No account matches this profile URL.</p>
        <div className="profile-actions">
          <button type="button" onClick={() => navigate('/home')}>
            Back to Home
          </button>
          <button type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/profile/${activeUser.username}`;
  const classCards = publicData.classes.map((item) => ({
    ...item,
    stackCount: publicData.stacks.filter((stack) => String(stack.classId) === String(item.id)).length,
  }));

  return (
    <div className="profile-page">
      <header className="class-view-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Stackd Logo" className="logo-image" />
          <h1 className="logo-text">Stackd</h1>
        </div>
      </header>

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: activeUser.username.toLowerCase() === sessionUsername.toLowerCase() ? 'My Profile' : activeUser.username },
        ]}
      />

      <div className="profile-headline">
        <h1>{activeUser.displayName}</h1>
        <p>@{activeUser.username}</p>
      </div>

      <div className="profile-public-card">
        <h2>Public Profile</h2>
        <p className="profile-meta">Joined {formatDate(activeUser.joinedAt)}</p>

        <div className="profile-field">
          <div className="profile-field-header">
            <span>Display Name</span>
            {isOwner && editingField !== 'displayName' && (
              <button type="button" onClick={() => setEditingField('displayName')}>
                Edit
              </button>
            )}
          </div>
          {isOwner && editingField === 'displayName' ? (
            <div className="profile-inline-edit">
              <input
                type="text"
                value={form.displayName}
                onChange={(event) => setForm((prev) => ({ ...prev, displayName: event.target.value }))}
              />
              <div className="profile-inline-actions">
                <button type="button" className="profile-save-button" onClick={() => handleSaveField('displayName')}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingField('');
                    setFeedback('');
                    setForm((prev) => ({ ...prev, displayName: activeUser.displayName }));
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p>{activeUser.displayName || activeUser.username}</p>
          )}
        </div>

        <div className="profile-field">
          <div className="profile-field-header">
            <span>Bio</span>
            {isOwner && editingField !== 'bio' && (
              <button type="button" onClick={() => setEditingField('bio')}>
                Edit
              </button>
            )}
          </div>
          {isOwner && editingField === 'bio' ? (
            <div className="profile-inline-edit">
              <textarea
                rows="3"
                value={form.bio}
                onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))}
              />
              <div className="profile-inline-actions">
                <button type="button" className="profile-save-button" onClick={() => handleSaveField('bio')}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingField('');
                    setFeedback('');
                    setForm((prev) => ({ ...prev, bio: activeUser.bio }));
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p>{activeUser.bio || 'No bio yet.'}</p>
          )}
        </div>

        <div className="profile-field">
          <div className="profile-field-header">
            <span>Major</span>
            {isOwner && editingField !== 'major' && (
              <button type="button" onClick={() => setEditingField('major')}>
                Edit
              </button>
            )}
          </div>
          {isOwner && editingField === 'major' ? (
            <div className="profile-inline-edit">
              <input
                type="text"
                value={form.major}
                onChange={(event) => setForm((prev) => ({ ...prev, major: event.target.value }))}
              />
              <div className="profile-inline-actions">
                <button type="button" className="profile-save-button" onClick={() => handleSaveField('major')}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingField('');
                    setFeedback('');
                    setForm((prev) => ({ ...prev, major: activeUser.major }));
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p>{activeUser.major || 'Not set'}</p>
          )}
        </div>

        <div className="profile-field">
          <span>Classes Created</span>
          {classCards.length > 0 ? (
            <div className={`cards-grid profile-cards-grid ${showMoreClasses ? 'show-all' : ''}`}>
              {classCards.map((item) => (
                <div
                  key={item.id}
                  className="class-card"
                  onClick={() => navigate(`/class/${item.id}`)}
                >
                  <div className="folder-wrapper">
                    <FontAwesomeIcon icon={faFolder} className="folder-icon" />
                    {item.stackCount > 0 && <span className="stack-badge">{item.stackCount}</span>}
                  </div>
                  <span className="class-name">{item.name}</span>
                </div>
              ))}
                {classCards.length > 5 && (
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
          <span>Stacks Created</span>
          {publicData.stacks.length > 0 ? (
            <div className={`cards-grid profile-cards-grid ${showMoreStacks ? 'show-all' : ''}`}>
              {publicData.stacks.map((item) => (
                <div
                  key={item.id}
                  className="stack-card"
                  onClick={() => navigate(`/stack/${item.id}`)}
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
              {publicData.stacks.length > 5 && (
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
        {sessionUsername && sessionUsername.toLowerCase() !== activeUser.username.toLowerCase() && (
          <button type="button" onClick={() => navigate(`/profile/${sessionUsername}`)}>
            My Profile
          </button>
        )}
        <button type="button" onClick={handleLogout}>
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