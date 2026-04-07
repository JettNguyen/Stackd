import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGlasses,
  faFolder,
  faChevronLeft,
  faChevronRight,
  faStar,
  faCheck,
  faPenToSquare,
  faLink,
  faCog,
  faSignOutAlt,
  faUsers,
  faEye,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import { apiRequest } from '../utils/api';
import useDelayedSpinner from '../utils/useDelayedSpinner';
import './StackView.css';

const StackView = () => {
  const STUDY_META_FADE_DURATION = 220;
  const STUDY_LIST_EXIT_DELAY = 180;
  const STUDY_LIST_EXIT_DURATION = 280;
  const STUDY_EXIT_DURATION = 360;
  const STUDY_ENTER_DURATION = 420;
  const BROWSE_ENTER_DURATION = 420;

  const navigate = useNavigate();
  const { id } = useParams();

  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [cardStatuses, setCardStatuses] = useState({});
  const [isFlipping, setIsFlipping] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [stack, setStack] = useState(null);
  const [stackCards, setStackCards] = useState([]);
  const [role, setRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [actionMessage, setActionMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const isLoadingVisible = useDelayedSpinner(isLoading, 1000);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState(null);
  const [isStudyContentEntering, setIsStudyContentEntering] = useState(false);
  const [isBrowseContentEntering, setIsBrowseContentEntering] = useState(false);

  const stackBreadcrumbItems = useMemo(() => {
    const items = [{ label: 'Home', to: '/home' }];

    if (stack?.className) {
      items.push({ label: stack.className, to: '/class' });
    }

    items.push({ label: stack?.name || 'Stack' });
    return items;
  }, [stack]);

  const copyTimeoutRef = useRef(null);
  const transitionTimeoutsRef = useRef([]);
  const slideDirectionRef = useRef(null);

  const clearTransitionTimeouts = () => {
    transitionTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
    transitionTimeoutsRef.current = [];
  };

  useEffect(() => {
    let isMounted = true;

    const loadStack = async () => {
      if (isMounted) {
        setIsLoading(true);
      }

      try {
        const response = await apiRequest(`/stack/view?stack=${id}`);
        if (!isMounted) {
          return;
        }

        const apiStack = response?.stack;
        const apiCards = Array.isArray(response?.cards) ? response.cards : [];

        setStack({
          id: apiStack?._id,
          name: apiStack?.name || 'Stack',
          className: response?.className || '',
        });

        setStackCards(
          apiCards.map((card, index) => ({
            id: card._id || card.id || index + 1,
            term: card.front || card.term || '',
            definition: card.back || card.definition || '',
          }))
        );

        const backendStatusMap = {};
        apiCards.forEach((card, index) => {
          const cardId = card._id || card.id || index + 1;
          if (card.status === 'review') {
            backendStatusMap[cardId] = 'star';
          }
          if (card.status === 'mastered') {
            backendStatusMap[cardId] = 'check';
          }
        });

        setCardStatuses(backendStatusMap);
        setRole(response?.role ?? null);
        setUsers(Array.isArray(response?.users) ? response.users : []);
      } catch (error) {
        if (isMounted) {
          setStack(null);
          setStackCards([]);
          setRole(null);
          setUsers([]);
          setCardStatuses({});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }

      setCurrentCardIndex(0);
      setShowDefinition(false);
    };

    loadStack();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      clearTransitionTimeouts();
    };
  }, []);

  const isTransitioningToStudy = transitionDirection === 'to-study';
  const isTransitioningToBrowse = transitionDirection === 'to-browse';
  const isAnimatingTransition = Boolean(transitionDirection || isStudyContentEntering || isBrowseContentEntering);

  const handleStudy = () => {
    if (isStudyMode || isAnimatingTransition) {
      return;
    }

    clearTransitionTimeouts();
    slideDirectionRef.current = null;
    setIsSettingsOpen(false);
    setCurrentCardIndex(0);
    setShowDefinition(false);
    setIsBrowseContentEntering(false);
    setTransitionDirection('to-study');

    const switchToStudyDelay = STUDY_META_FADE_DURATION + STUDY_LIST_EXIT_DELAY + STUDY_LIST_EXIT_DURATION;
    const switchTimeoutId = setTimeout(() => {
      setIsStudyMode(true);
      setTransitionDirection(null);
      setIsStudyContentEntering(true);

      const enterTimeoutId = setTimeout(() => {
        setIsStudyContentEntering(false);
      }, STUDY_ENTER_DURATION);

      transitionTimeoutsRef.current.push(enterTimeoutId);
    }, switchToStudyDelay);

    transitionTimeoutsRef.current.push(switchTimeoutId);
  };

  const handleExitStudy = () => {
    if (!isStudyMode || isAnimatingTransition) {
      return;
    }

    clearTransitionTimeouts();
    slideDirectionRef.current = null;
    setIsStudyContentEntering(false);
    setTransitionDirection('to-browse');

    const switchToBrowseId = setTimeout(() => {
      setIsStudyMode(false);
      setTransitionDirection(null);
      setIsBrowseContentEntering(true);

      const browseEnterTimeoutId = setTimeout(() => {
        setIsBrowseContentEntering(false);
      }, BROWSE_ENTER_DURATION);

      transitionTimeoutsRef.current.push(browseEnterTimeoutId);
    }, STUDY_EXIT_DURATION);

    transitionTimeoutsRef.current.push(switchToBrowseId);
  };

  const handleEdit = () => {
    if (!stack) {
      return;
    }

    navigate('/stack/new', {
      state: {
        stackName: stack.name,
        cards: stackCards,
      },
    });
  };

  const handleCopyLink = async () => {
    if (!stack) {
      return;
    }

    const shareUrl = `${window.location.origin}/stack/${stack.id}`;

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
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setIsLinkCopied(false);
    }, 1500);
  };

  const handlePrevCard = () => {
    if (currentCardIndex === 0) {
      return;
    }

    slideDirectionRef.current = 'prev';
    setIsFlipping(false);
    setCurrentCardIndex((prev) => prev - 1);
    setShowDefinition(false);
  };

  const handleNextCard = () => {
    if (currentCardIndex >= stackCards.length - 1) {
      return;
    }

    slideDirectionRef.current = 'next';
    setIsFlipping(false);
    setCurrentCardIndex((prev) => prev + 1);
    setShowDefinition(false);
  };

  const handleCardClick = () => {
    if (isFlipping) {
      return;
    }

    setIsFlipping(true);
    setTimeout(() => setShowDefinition((prev) => !prev), 125);
    setTimeout(() => setIsFlipping(false), 250);
  };

  const toggleCardStatus = (cardId, status) => {
    setCardStatuses((prev) => ({
      ...prev,
      [cardId]: prev[cardId] === status ? null : status,
    }));
  };

  const handleStar = () => {
    const cardId = stackCards[currentCardIndex]?.id;
    if (!cardId) {
      return;
    }
    toggleCardStatus(cardId, 'star');
  };

  const handleCheckCard = () => {
    const cardId = stackCards[currentCardIndex]?.id;
    if (!cardId) {
      return;
    }
    toggleCardStatus(cardId, 'check');
  };

  const handleUnavailableAction = (label) => {
    setActionMessage(`${label} is currently unavailable.`);
    setTimeout(() => setActionMessage(''), 2000);
  };

  const confirmDeleteStack = async () => {
    setIsDeleteModalOpen(false);
    setActionMessage('Deleting stack...');
    try {
      await apiRequest('/stack/delete', {
        method: 'POST',
        body: JSON.stringify({ stackId: stack.id }),
      });
      navigate('/home');
    } catch (err) {
      setActionMessage(err?.payload?.message || err?.message || 'Failed to delete stack.');
    }
  };

  const isOwner = role === 'owner';
  const canEdit = role === 'owner' || role === 'editor';
  const isMember = Boolean(role);

  if (isLoading) {
    return (
      <div className="stack-view-page">
        {isLoadingVisible ? (
          <div className="stack-view-loading" role="status" aria-live="polite">
            <div className="stack-view-loading-spinner"></div>
            <p>Loading stack...</p>
          </div>
        ) : (
          <div className="stack-view-loading-delayed-placeholder" aria-hidden="true" />
        )}
      </div>
    );
  }

  if (!stack) {
    return (
      <div className="stack-view-page">
        <div className="stack-view-content">
          <Breadcrumbs items={stackBreadcrumbItems} />
          <p className="profile-empty">Stack not found.</p>
        </div>
      </div>
    );
  }

  const currentCard = stackCards[currentCardIndex] ?? null;

  return (
    <div className="stack-view-page">
      <div className="stack-view-content content-appear">
        <Breadcrumbs items={stackBreadcrumbItems} />
        <div className="stack-view-stage">
        {!isStudyMode ? (
          <div className={`stack-browse-mode ${isTransitioningToStudy ? 'transitioning-to-study' : ''} ${isBrowseContentEntering ? 'entering-from-study' : ''}`}>
            <div className="stack-actions">
              <button
                type="button"
                className="stack-side-button stack-side-button-link"
                onClick={handleCopyLink}
                aria-label="Copy stack link"
              >
                <FontAwesomeIcon icon={faLink} />
              </button>

              <div className="stack-card-large">
                <div className="stack-layer-back"></div>
                <div className="stack-layer-middle"></div>
                <div className="stack-layer-front">
                  <span>{stack.name}</span>
                </div>
              </div>

              {canEdit ? (
                <button
                  type="button"
                  className="stack-side-button stack-side-button-edit"
                  onClick={handleEdit}
                  aria-label="Edit stack"
                >
                  <FontAwesomeIcon icon={faPenToSquare} />
                </button>
              ) : (
                <div className="profile-button-placeholder"></div>
              )}
            </div>

            {isLinkCopied && (
              <div className="copy-toast" role="status" aria-live="polite">
                Link copied
              </div>
            )}

            <div className="stack-info">
              <div className="info-item">
                <FontAwesomeIcon icon={faFolder} className="info-icon" />
                <span>{stack.className || 'No class'}</span>
              </div>
              <div className="info-item">
                <span>{stackCards.length} Cards</span>
              </div>
              <div className="info-item">
                <span>{role ? `Role: ${role}` : 'Role: guest'}</span>
              </div>
            </div>

            <div className="stack-action-buttons">
              <button
                type="button"
                className={`view-button ${isTransitioningToStudy ? 'view-button-transitioning' : ''} ${isBrowseContentEntering ? 'view-button-entering' : ''}`}
                onClick={handleStudy}
                disabled={isAnimatingTransition}
              >
                <FontAwesomeIcon icon={faGlasses} />
                <span>Study</span>
              </button>

              <button
                type="button"
                className="stack-settings-button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Stack settings"
                disabled={isAnimatingTransition}
              >
                <FontAwesomeIcon icon={faCog} />
              </button>
            </div>

            {actionMessage && <p className="stack-action-message">{actionMessage}</p>}

            <div className="flashcards-list">
              <div className="flashcards-header">
                <span>Term</span>
                <span>Definition</span>
              </div>

              {stackCards.map((card, index) => (
                <div key={card.id} className="flashcard-item">
                  <div className="flashcard-row">
                    <div className="term-box">
                      <div className="term-content">
                        <span>{card.term}</span>
                      </div>
                      <div className="card-status-buttons">
                        <button
                          type="button"
                          className={`status-btn-inline star ${cardStatuses[card.id] === 'star' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardStatus(card.id, 'star');
                          }}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                        <button
                          type="button"
                          className={`status-btn-inline check ${cardStatuses[card.id] === 'check' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardStatus(card.id, 'check');
                          }}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      </div>
                    </div>
                    <div className="definition-box">
                      <span>{card.definition}</span>
                    </div>
                  </div>
                  {index < stackCards.length - 1 && <div className="flashcard-divider"></div>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`study-mode ${isStudyContentEntering ? 'study-mode-entering' : ''} ${isTransitioningToBrowse ? 'study-mode-exiting' : ''}`}>
            <div className="stack-card-large study-card-display">
              <div className="stack-layer-back"></div>
              <div className="stack-layer-middle"></div>
              <div className="stack-layer-front">
                <span>{stack.name}</span>
              </div>
            </div>

            <button
              type="button"
              className={`view-button study-active ${isStudyContentEntering ? 'study-view-button-entering' : ''} ${isTransitioningToBrowse ? 'study-view-button-exiting' : ''}`}
              onClick={handleExitStudy}
            >
              <FontAwesomeIcon icon={faGlasses} />
              <span>view</span>
            </button>

            <div className={`card-counter ${isStudyContentEntering ? 'study-detail-entering' : ''} ${isTransitioningToBrowse ? 'study-detail-exiting' : ''}`}>
              <span>{currentCardIndex + 1}/{stackCards.length}</span>
            </div>

            <div className={`study-flashcard-container ${isStudyContentEntering ? 'study-detail-entering' : ''} ${isTransitioningToBrowse ? 'study-detail-exiting' : ''}`}>
              <button
                type="button"
                className="nav-arrow left-arrow"
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              <div
                key={currentCardIndex}
                className={`study-flashcard ${isFlipping ? 'flipping' : ''}${slideDirectionRef.current ? ` slide-in-${slideDirectionRef.current}` : ''}`}
                onClick={handleCardClick}
              >
                {currentCard && cardStatuses[currentCard.id] && (
                  <div className={`card-status-badge ${cardStatuses[currentCard.id]}`}>
                    <FontAwesomeIcon icon={cardStatuses[currentCard.id] === 'star' ? faStar : faCheck} />
                  </div>
                )}
                <span className="study-card-text">
                  {showDefinition ? currentCard?.definition || '' : currentCard?.term || ''}
                </span>
              </div>

              <button
                type="button"
                className="nav-arrow right-arrow"
                onClick={handleNextCard}
                disabled={currentCardIndex === stackCards.length - 1}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>

            {createPortal(
              <div className={`study-actions-bar ${isStudyContentEntering ? 'study-actions-bar-transitioning' : ''} ${isTransitioningToBrowse ? 'study-actions-bar-exiting' : ''}`}>
                <button
                  type="button"
                  className={`study-action-btn star-btn ${currentCard && cardStatuses[currentCard.id] === 'star' ? 'active' : ''}`}
                  onClick={handleStar}
                >
                  <FontAwesomeIcon icon={faStar} />
                </button>
                <button
                  type="button"
                  className={`study-action-btn check-btn ${currentCard && cardStatuses[currentCard.id] === 'check' ? 'active' : ''}`}
                  onClick={handleCheckCard}
                >
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              </div>,
              document.body
            )}
          </div>
        )}
        </div>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Stack"
      >
        <p>Are you sure you want to delete this stack? This action cannot be undone.</p>
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
            onClick={confirmDeleteStack}
          >
            Delete Stack
          </button>
        </div>
      </Modal>

      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Stack Settings">
        {/* Membership Section */}
        <div className="modal-section">
          <h3 className="modal-section-title">Membership</h3>
          <button
            type="button"
            className="modal-option-button"
            onClick={() => {
              handleUnavailableAction(isMember ? 'Leave stack' : 'Join stack');
              setIsSettingsOpen(false);
            }}
          >
            <div className="modal-option-icon">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </div>
            <span className="modal-option-text">{isMember ? 'Leave Stack' : 'Join Stack'}</span>
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
                handleEdit();
                setIsSettingsOpen(false);
              }}
            >
              <div className="modal-option-icon">
                <FontAwesomeIcon icon={faPenToSquare} />
              </div>
              <span className="modal-option-text">Edit Stack Info</span>
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

        {isOwner && (
          <div className="modal-section modal-danger-section">
            <h3 className="modal-section-title">Danger Zone</h3>
            <button
              type="button"
              className="modal-option-button"
              onClick={() => {
                setIsSettingsOpen(false);
                setIsDeleteModalOpen(true);
              }}
            >
              <div className="modal-option-icon">
                <FontAwesomeIcon icon={faTrash} />
              </div>
              <span className="modal-option-text">Delete Stack</span>
            </button>
          </div>
        )}

        {/* Members List */}
        {isOwner && users.length > 0 && (
          <div className="modal-section">
            <h3 className="modal-section-title">Stack Members ({users.length})</h3>
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

export default StackView;
