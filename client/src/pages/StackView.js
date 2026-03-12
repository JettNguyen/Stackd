import React, { useEffect, useRef, useState } from 'react';
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
import PageHeader from '../components/PageHeader';
import { apiRequest } from '../utils/api';
import './StackView.css';

const StackView = () => {
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const copyTimeoutRef = useRef(null);

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
    };
  }, []);

  const handleBack = () => {
    if (isStudyMode) {
      setIsStudyMode(false);
      setCurrentCardIndex(0);
      setShowDefinition(false);
      return;
    }

    navigate(-1);
  };

  const handleStudy = () => {
    setIsStudyMode(true);
    setCurrentCardIndex(0);
    setShowDefinition(false);
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

    setCurrentCardIndex((prev) => prev - 1);
    setShowDefinition(false);
  };

  const handleNextCard = () => {
    if (currentCardIndex >= stackCards.length - 1) {
      return;
    }

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
    setActionMessage(`${label} will be available once stack action routes are added.`);
    setTimeout(() => {
      setActionMessage('');
    }, 2000);
  };

  const isOwner = role === 'owner';
  const canEdit = role === 'owner' || role === 'editor';
  const isMember = Boolean(role);

  if (isLoading) {
    return (
      <div className="stack-view-page">
        <PageHeader showBack showProfile />

        <div className="stack-view-content">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/home' },
              { label: 'Stack' },
            ]}
          />
          <div className="stack-view-loading" role="status" aria-live="polite">
            <div className="stack-view-loading-spinner"></div>
            <p>Loading stack...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stack) {
    return (
      <div className="stack-view-page">
        <div className="stack-view-content">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/home' },
              { label: 'Stack' },
            ]}
          />
          <p className="profile-empty">Stack not found.</p>
        </div>
      </div>
    );
  }

  const currentCard = stackCards[currentCardIndex] ?? null;

  return (
    <div className="stack-view-page">
      <PageHeader showBack onBack={handleBack} showProfile={!isStudyMode} />

      <div className="stack-view-content">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: stack.name || 'Stack' },
          ]}
        />
        {!isStudyMode ? (
          <div className="stack-browse-mode">
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
              <button type="button" className="view-button" onClick={handleStudy}>
                <FontAwesomeIcon icon={faGlasses} />
                <span>Study</span>
              </button>

              <button
                type="button"
                className="stack-settings-button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Stack settings"
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
          <div className="study-mode">
            <div className="stack-card-large study-card-display">
              <div className="stack-layer-back"></div>
              <div className="stack-layer-middle"></div>
              <div className="stack-layer-front">
                <span>{stack.name}</span>
              </div>
            </div>

            <button type="button" className="view-button study-active" onClick={() => setIsStudyMode(false)}>
              <FontAwesomeIcon icon={faGlasses} />
              <span>view</span>
            </button>

            <div className="card-counter">
              <span>{currentCardIndex + 1}/{stackCards.length}</span>
            </div>

            <div className="study-flashcard-container">
              <button
                type="button"
                className="nav-arrow left-arrow"
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>

              <div className={`study-flashcard ${isFlipping ? 'flipping' : ''}`} onClick={handleCardClick}>
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

            <div className="study-actions-bar">
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
            </div>
          </div>
        )}
      </div>

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

        {/* Danger Zone */}
        {isOwner && (
          <div className="modal-section modal-danger-section">
            <h3 className="modal-section-title">Danger Zone</h3>
            <button
              type="button"
              className="modal-option-button"
              onClick={() => {
                handleUnavailableAction('Delete stack');
                setIsSettingsOpen(false);
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
