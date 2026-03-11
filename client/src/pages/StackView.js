import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faGlasses,
  faFolder,
  faChevronLeft,
  faChevronRight,
  faStar,
  faCheck,
  faPenToSquare,
  faLink,
} from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import {
  getSessionUsername,
  getStackById,
  getStackCardsByStackId,
} from '../utils/mockData';
import Breadcrumbs from '../components/Breadcrumbs';
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

  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    const username = getSessionUsername();
    if (!username) {
      return;
    }

    let isMounted = true;

    const loadStack = async () => {
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
      } catch {
        if (!isMounted) {
          return;
        }

        const fallbackStack = getStackById(id);
        setStack(fallbackStack);
        setStackCards(fallbackStack ? getStackCardsByStackId(fallbackStack.id) : []);
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
      <header className="stack-view-header">
        <button type="button" className="back-button" onClick={handleBack}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Stackd Logo" className="logo-image" />
          <h1 className="logo-text">Stackd</h1>
        </div>

        {!isStudyMode ? (
          <button type="button" className="profile-button" onClick={() => navigate('/profile')}>
            <FontAwesomeIcon icon={faUser} />
          </button>
        ) : (
          <div className="profile-button-placeholder"></div>
        )}
      </header>

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: stack.name || 'Stack' },
        ]}
      />

      <div className="stack-view-content">
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

              <button
                type="button"
                className="stack-side-button stack-side-button-edit"
                onClick={handleEdit}
                aria-label="Edit stack"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
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
                <span>{stack.className || 'No class'}</span>
              </div>
              <div className="info-item">
                <span>{stackCards.length} Cards</span>
              </div>
            </div>

            <div className="stack-action-buttons">
              <button type="button" className="view-button" onClick={handleStudy}>
                <FontAwesomeIcon icon={faGlasses} />
                <span>view</span>
              </button>
            </div>

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
    </div>
  );
};

export default StackView;
