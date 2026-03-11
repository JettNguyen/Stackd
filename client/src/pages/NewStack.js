import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronLeft, faPlus, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import { createMockStack, getOrInitMockData, getSessionUsername } from '../utils/mockData';
import Breadcrumbs from '../components/Breadcrumbs';
import './NewStack.css';

const NewStack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialStackName = location.state?.stackName ?? '';
  const initialCards = location.state?.cards?.length
    ? location.state.cards.map((card, i) => ({ id: i + 1, term: card.term || '', definition: card.definition || '' }))
    : [{ id: 1, term: '', definition: '' }];

  const [stackName, setStackName] = useState(initialStackName);
  const [importText, setImportText] = useState('');
  const [cards, setCards] = useState(initialCards);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sessionUsername, setSessionUsername] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const username = getSessionUsername();
    if (!username) {
      navigate('/', { replace: true });
      return;
    }
    setSessionUsername(username);
    const data = getOrInitMockData(username);
    setClasses(data.classes);
  }, [navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const parseImport = (text) => {
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const commaIndex = line.indexOf(',');
        if (commaIndex === -1) return null;
        const term = line.slice(0, commaIndex).trim();
        const definition = line.slice(commaIndex + 1).trim();
        if (!term && !definition) return null;
        return { term, definition };
      })
      .filter(Boolean);
  };

  const handleImport = () => {
    const parsed = parseImport(importText);
    if (parsed.length === 0) return;
    setCards(parsed.map((card, index) => ({ id: index + 1, ...card })));
  };

  const handleCardChange = (id, field, value) => {
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, [field]: value } : card)));
  };

  const handleAddCard = () => {
    setCards((prev) => {
      const nextId = prev.length ? Math.max(...prev.map((card) => card.id)) + 1 : 1;
      return [...prev, { id: nextId, term: '', definition: '' }];
    });
  };

  const handleDeleteCard = (id) => {
    setCards((prev) => prev.filter((card) => card.id !== id));
  };

  const autoResize = (element) => {
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    const inputs = document.querySelectorAll('.flashcard-input');
    inputs.forEach((element) => autoResize(element));
  }, [cards]);

  const handleOpenModal = () => {
    if (!stackName.trim()) {
      setFeedback('Please enter a stack name before saving.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClassId(null);
  };

  const handleSaveStack = () => {
    if (!sessionUsername) {
      return;
    }

    createMockStack({
      ownerUsername: sessionUsername,
      name: stackName.trim(),
      classId: selectedClassId,
      cardCount: cards.filter((card) => card.term.trim() || card.definition.trim()).length,
      cards,
    });

    handleCloseModal();
    navigate('/home');
  };

  return (
    <div className="new-stack-page">
      <header className="new-stack-header">
        <button className="back-button" onClick={handleBack}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>

        <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Stackd Logo" className="logo-image" />
          <h1 className="logo-text">Stackd</h1>
        </div>

        <button className="profile-button" onClick={() => navigate('/profile')}>
          <FontAwesomeIcon icon={faUser} />
        </button>
      </header>

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: 'New Stack' },
        ]}
      />

      <div className="new-stack-content">
        <div className="stack-preview">
          <div className="new-stack-card">
            <div className="stack-layer-back"></div>
            <div className="stack-layer-middle"></div>
            <div className="stack-layer-front">
              <span>{stackName || 'Stack Name'}</span>
            </div>
          </div>
        </div>

        <div className="stack-name-row">
          <label htmlFor="stack-name-input">Name:</label>
          <input
            id="stack-name-input"
            className="stack-name-input"
            type="text"
            value={stackName}
            onChange={(event) => setStackName(event.target.value)}
            placeholder="Stack Name"
          />
        </div>

        {feedback && <p className="new-stack-feedback">{feedback}</p>}

        <section className={`import-section ${isImportOpen ? 'open' : 'collapsed'}`}>
          <button
            type="button"
            className="import-toggle"
            onClick={() => setIsImportOpen((prev) => !prev)}
          >
            <span>Import from Quizlet</span>
            <span className="import-chevron">
              <FontAwesomeIcon icon={faChevronDown} />
            </span>
          </button>
          {isImportOpen && (
            <div className="import-body">
              <textarea
                className="import-textarea"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder="Paste exported Quizlet text here"
              />
              <div className="import-actions">
                <button type="button" className="import-button" onClick={handleImport}>
                  Import
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="flashcards-panel">
          <div className="flashcards-header">
            <span>TERM</span>
            <span>DEFINITION</span>
          </div>

          {cards.map((card, index) => (
            <div key={card.id} className="flashcard-item">
              <div className="flashcard-row">
                <div
                  className="flashcard-term-input"
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-label="Term"
                  data-placeholder="Term"
                  onInput={(event) => handleCardChange(card.id, 'term', event.currentTarget.textContent || '')}
                >
                  {card.term}
                </div>
                <textarea
                  className="flashcard-input flashcard-textarea"
                  value={card.definition}
                  onChange={(event) => handleCardChange(card.id, 'definition', event.target.value)}
                  onInput={(event) => autoResize(event.currentTarget)}
                  ref={(element) => autoResize(element)}
                  placeholder="Definition"
                />
              </div>
              <div className="flashcard-actions">
                <button
                  type="button"
                  className="flashcard-delete"
                  onClick={() => handleDeleteCard(card.id)}
                  aria-label="Delete card"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              {index < cards.length - 1 && <div className="flashcard-divider"></div>}
            </div>
          ))}

          <button type="button" className="add-card-button" onClick={handleAddCard}>
            <FontAwesomeIcon icon={faPlus} />
            <span>add</span>
          </button>
        </section>
      </div>

      <div className="new-stack-actions-bar">
        <button type="button" className="save-stack-button" onClick={handleOpenModal}>Add to...</button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add to Class</h2>
            <p className="modal-subtitle">Select a class or save without one</p>

            <div className="modal-classes-grid">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  className={`modal-class-button ${selectedClassId === cls.id ? 'selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedClassId(cls.id)}
                >
                  {cls.name}
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button type="button" className="modal-cancel-button" onClick={handleCloseModal}>
                Cancel
              </button>
              <button type="button" className="modal-save-button" onClick={handleSaveStack}>
                Save Stack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewStack;