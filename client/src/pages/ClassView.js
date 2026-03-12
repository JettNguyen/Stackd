import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFolder,
  faLink,
  faPlus,
  faCog,
  faSignOutAlt,
  faEdit,
  faUsers,
  faEye,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../utils/api';
import './Home.css';
import './StackView.css';
import './ClassView.css';

const ClassView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [classItem, setClassItem] = useState(null);
  const [stacks, setStacks] = useState([]);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadClass = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const response = await apiRequest(`/class/view?class=${id}`);
        if (!isMounted) {
          return;
        }

        setClassItem({ id, name: response?.name || 'Class' });
        setStacks(
          (response?.stacks || []).map((stack) => ({
            id: stack._id,
            name: stack.name,
            className: response?.name || '',
          }))
        );
        setRole(response?.role ?? null);
        setUsers(Array.isArray(response?.users) ? response.users : []);
      } catch (error) {
        if (isMounted) {
          setClassItem(null);
          setStacks([]);
          setRole(null);
          setUsers([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadClass();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isLinkCopied) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setIsLinkCopied(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLinkCopied]);

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/class/${id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    setIsLinkCopied(true);
  };

  const handleAddStack = () => {
    if (!classItem) {
      return;
    }

    navigate('/stack/new', {
      state: {
        selectedClassId: classItem.id,
      },
    });
  };

  const handleUnavailableAction = (label) => {
    setActionMessage(`${label} will be available once class action routes are added.`);
    setTimeout(() => {
      setActionMessage('');
    }, 2000);
  };

  const isOwner = role === 'owner';
  const canEdit = role === 'owner' || role === 'editor';
  const isMember = Boolean(role);

  if (isLoading) {
    return (
      <div className="class-view-page">
        <PageHeader showBack showProfile />

        <div className="class-view-content">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/home' },
              { label: 'Class' },
            ]}
          />
          <div className="class-view-loading" role="status" aria-live="polite">
            <div className="class-view-loading-spinner"></div>
            <p>Loading class...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="class-view-page">
        <div className="class-view-content">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/home' },
              { label: 'Class' },
            ]}
          />
          <div className="class-view-empty-state">
            <h1>We couldn't find that class.</h1>
            <p>It may have been removed or you may not have access to it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="class-view-page">
      <PageHeader showBack showProfile />

      <div className="class-view-content">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: classItem.name || 'Class' },
          ]}
        />
        <div className="class-view-shell">
          <div className="class-actions">
            <button
              type="button"
              className="stack-side-button stack-side-button-link"
              onClick={handleCopyLink}
              aria-label="Copy class link"
            >
              <FontAwesomeIcon icon={faLink} />
            </button>

            <div className="class-view-hero-card">
              <div className="folder-wrapper class-view-folder-wrapper">
                <FontAwesomeIcon icon={faFolder} className="folder-icon" />
              </div>
            </div>

            <button
              type="button"
              className="stack-side-button class-side-button-add"
              onClick={handleAddStack}
              aria-label="Add stack to class"
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          {isLinkCopied && (
            <div className="copy-toast" role="status" aria-live="polite">
              Link copied
            </div>
          )}

          <div className="stack-info">
            <div className="info-item">
              <FontAwesomeIcon icon={faFolder} className="info-icon" />
              <span>{classItem.name}</span>
            </div>
            <div className="info-item">
              <span>{stacks.length} {stacks.length === 1 ? 'Stack' : 'Stacks'}</span>
            </div>
            <div className="info-item">
              <span>{role ? `Role: ${role}` : 'Role: guest'}</span>
            </div>
          </div>

          <div className="stack-action-buttons">
            <button
              type="button"
              className="stack-settings-button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label="Class settings"
            >
              <FontAwesomeIcon icon={faCog} />
            </button>
          </div>

          {actionMessage && <p className="class-action-message">{actionMessage}</p>}
        </div>

        <section className="class-view-section">
          {stacks.length > 0 ? (
            <div className="cards-grid show-all class-view-stacks-grid">
              {stacks.map((stack) => (
                <div key={stack.id} className="stack-card" onClick={() => navigate(`/stack/${stack.id}`)}>
                  <div className="stack-layer-back"></div>
                  <div className="stack-layer-middle"></div>
                  <div className="stack-layer-front">
                    <div className="stack-content">
                      <span className="stack-name">{stack.name}</span>
                      {stack.className && <span className="stack-class-label">{stack.className}</span>}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="class-view-add-tile" onClick={handleAddStack}>
                <span className="class-view-add-plus">+</span>
                <span>add</span>
              </button>
            </div>
          ) : (
            <div className="class-view-empty-card">
              <p className="class-view-empty">No stacks in this class yet.</p>
              <button type="button" className="view-button class-view-empty-button" onClick={handleAddStack}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Add your first stack</span>
              </button>
            </div>
          )}
        </section>
      </div>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Class Settings">
        {/* Membership Section */}
        <div className="modal-section">
          <h3 className="modal-section-title">Membership</h3>
          <button
            type="button"
            className="modal-option-button"
            onClick={() => {
              handleUnavailableAction(isMember ? 'Leave class' : 'Join class');
              setIsSettingsOpen(false);
            }}
          >
            <div className="modal-option-icon">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </div>
            <span className="modal-option-text">{isMember ? 'Leave Class' : 'Join Class'}</span>
          </button>
        </div>

        {/* Edit Section */}
        {canEdit && (
          <div className="modal-section">
            <h3 className="modal-section-title">Editing</h3>
            <button
              type="button"
              className="modal-option-button"
              onClick={() => {
                handleUnavailableAction('Edit class info');
                setIsSettingsOpen(false);
              }}
            >
              <div className="modal-option-icon">
                <FontAwesomeIcon icon={faEdit} />
              </div>
              <span className="modal-option-text">Edit Class Info</span>
            </button>
          </div>
        )}

        {/* Owner Section */}
        {isOwner && (
          <div className="modal-section">
            <h3 className="modal-section-title">Administration</h3>
            <button
              type="button"
              className="modal-option-button"
              onClick={() => {
                handleUnavailableAction('Manage users');
                setIsSettingsOpen(false);
              }}
            >
              <div className="modal-option-icon">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <span className="modal-option-text">Add/Remove Users</span>
            </button>
            <button
              type="button"
              className="modal-option-button"
              onClick={() => {
                handleUnavailableAction('Toggle visibility');
                setIsSettingsOpen(false);
              }}
            >
              <div className="modal-option-icon">
                <FontAwesomeIcon icon={faEye} />
              </div>
              <span className="modal-option-text">Toggle Visibility</span>
            </button>
          </div>
        )}

        {/* Danger Zone */}
        {isOwner && (
          <div className="modal-section modal-danger-section">
            <h3 className="modal-section-title">Danger Zone</h3>
            <button
              type="button"
              className="modal-option-button"
              onClick={() => {
                handleUnavailableAction('Delete class');
                setIsSettingsOpen(false);
              }}
            >
              <div className="modal-option-icon">
                <FontAwesomeIcon icon={faTrash} />
              </div>
              <span className="modal-option-text">Delete Class</span>
            </button>
          </div>
        )}

        {/* Members List */}
        {isOwner && users.length > 0 && (
          <div className="modal-section">
            <h3 className="modal-section-title">Class Members ({users.length})</h3>
            <div className="modal-members-list">
              {users.map((member) => (
                <div key={`${member.accountId}-${member.username}`} className="modal-member-chip">
                  <span className="modal-member-name">{member.username}</span>
                  <span className="modal-member-role">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClassView;