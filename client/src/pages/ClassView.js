import React, { useEffect, useState } from 'react';
import useDelayedSpinner from '../utils/useDelayedSpinner';
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
import { apiRequest, getAuthToken } from '../utils/api';
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
  const isLoadingVisible = useDelayedSpinner(isLoading, 1000);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddStackModalOpen, setIsAddStackModalOpen] = useState(false);
  const [userStacks, setUserStacks] = useState([]);
  const [selectedAddStackId, setSelectedAddStackId] = useState('');
  const [addStackFeedback, setAddStackFeedback] = useState('');
  const [isAddingStack, setIsAddingStack] = useState(false);

  const handleUnavailableAction = (action) => {
    setActionMessage(`${action} is currently unavailable.`);
    setTimeout(() => setActionMessage(''), 2000);
  };

  useEffect(() => {
    let isMounted = true;

    const loadClass = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const response = await apiRequest(`/class/view?class=${id}`);
        if (!isMounted) return;

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
    if (!isLinkCopied) return undefined;

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

  const handleAddStack = async () => {
    if (!classItem) return;
    setIsAddStackModalOpen(true);
    setAddStackFeedback('');
    setIsAddingStack(false);
    setSelectedAddStackId('');
    try {
      const res = await apiRequest('/account/user');
      const classStackIds = new Set(stacks.map(s => s.id));
      setUserStacks((res.stacks || []).filter(s => !classStackIds.has(s._id)));
    } catch {
      setUserStacks([]);
    }
  };

  const handleAddExistingStack = async (stackId) => {
    if (!classItem || !stackId) return;
    setIsAddingStack(true);
    setAddStackFeedback('');
    try {
      await apiRequest(`/class/add-stack`, {
        method: 'POST',
        body: JSON.stringify({ classId: classItem.id, stackId }),
      });
      setAddStackFeedback('Stack added!');
      setTimeout(() => {
        setIsAddStackModalOpen(false);
        window.location.reload();
      }, 800);
    } catch (err) {
      setAddStackFeedback(err.message || 'Failed to add stack.');
    } finally {
      setIsAddingStack(false);
    }
  };

  const handleCreateNewStack = () => {
    setIsAddStackModalOpen(false);
    navigate('/stack/new', { state: { selectedClassId: classItem.id } });
  };

  const handleDeleteClass = () => {
    if (!classItem) return;
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteClass = async () => {
    if (!classItem) return;
    setIsDeleteModalOpen(false);
    setActionMessage('Deleting class...');

    const token = getAuthToken();
    if (!token) {
      setActionMessage('You must be signed in to delete a class.');
      return;
    }

    if (!classItem.id) {
      setActionMessage('Missing class identifier.');
      return;
    }

    try {
      await apiRequest('/class/delete', {
        method: 'POST',
        body: JSON.stringify({ classId: classItem.id }),
      });
      setActionMessage('Class deleted.');
      setTimeout(() => navigate('/home'), 1000);
    } catch (err) {
      const msg = err?.payload?.message || err?.message || 'Failed to delete class.';
      if (err?.status === 403) {
        setActionMessage('You are not permitted to delete this class.');
      } else {
        setActionMessage(msg);
      }
    }
  };

  const isOwner = role === 'owner';
  const canEdit = role === 'owner' || role === 'editor';
  const isMember = Boolean(role);

  if (isLoading) {
    return (
      <div className="class-view-page">
        {isLoadingVisible && (
          <div className="class-view-loading" role="status" aria-live="polite">
            <div className="class-view-loading-spinner"></div>
            <p>Loading class...</p>
          </div>
        )}
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
      <div className="class-view-content content-appear">
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Class"
        >
          <p>Are you sure you want to delete this class? This action cannot be undone.</p>
          <div className="modal-actions">
            <button
              type="button"
              className="switch-button"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="login-button"
              onClick={confirmDeleteClass}
            >
              Delete Class
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={isAddStackModalOpen}
          onClose={() => setIsAddStackModalOpen(false)}
          title="Add Stack to Class"
        >
          {userStacks.length > 0 ? (
            <>
              <div className="add-stack-select-wrapper">
                <select
                  className="add-stack-select"
                  value={selectedAddStackId}
                  onChange={(e) => setSelectedAddStackId(e.target.value)}
                  disabled={isAddingStack}
                >
                  <option value="">Select a stack...</option>
                  {userStacks.map((stack) => (
                    <option key={stack._id} value={stack._id}>{stack.name}</option>
                  ))}
                </select>
              </div>
              <div className="add-stack-actions">
                <button
                  type="button"
                  className="add-stack-secondary"
                  onClick={handleCreateNewStack}
                  disabled={isAddingStack}
                >
                  Create New Stack
                </button>
                {selectedAddStackId && (
                  <button
                    type="button"
                    className="add-stack-primary"
                    onClick={() => handleAddExistingStack(selectedAddStackId)}
                    disabled={isAddingStack}
                  >
                    {isAddingStack ? 'Adding...' : 'Add Stack'}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="add-stack-actions">
              <button
                type="button"
                className="add-stack-primary"
                onClick={handleCreateNewStack}
                disabled={isAddingStack}
              >
                Create New Stack
              </button>
            </div>
          )}
          {addStackFeedback && <p className="add-stack-feedback">{addStackFeedback}</p>}
        </Modal>

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

        {isOwner && (
          <div className="modal-section modal-danger-section">
            <h3 className="modal-section-title">Danger Zone</h3>
            <button
              type="button"
              className="modal-option-button"
              onClick={() => {
                setIsSettingsOpen(false);
                handleDeleteClass();
              }}
            >
              <div className="modal-option-icon">
                <FontAwesomeIcon icon={faTrash} />
              </div>
              <span className="modal-option-text">Delete Class</span>
            </button>
          </div>
        )}

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
