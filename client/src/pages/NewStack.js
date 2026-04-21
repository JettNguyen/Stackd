import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { apiRequest, getAuthToken } from '../utils/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Modal from '../components/Modal';
import useDelayedSpinner from '../utils/useDelayedSpinner';
import './NewStack.css';

const NewStack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingStackId = location.state?.stackId ?? null;
  const isEditing = Boolean(editingStackId);
  const initialStackName = location.state?.stackName ?? '';
  const initialSelectedClassId = location.state?.selectedClassId ?? null;
  const initialCards = location.state?.cards?.length
    ? location.state.cards.map((card, i) => ({ id: i + 1, term: card.term || '', definition: card.definition || '' }))
    : [{ id: 1, term: '', definition: '' }];

  const [stackName, setStackName] = useState(initialStackName);
  const [importText, setImportText] = useState('');
  const [cards, setCards] = useState(initialCards);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(initialSelectedClassId);
  const [classes, setClasses] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [importFeedback, setImportFeedback] = useState('');
  const [importFeedbackIsError, setImportFeedbackIsError] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiFeedbackIsError, setAiFeedbackIsError] = useState(false);
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [aiCardCount, setAiCardCount] = useState(10);
  const [aiAutoCardCount, setAiAutoCardCount] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [aiFileError, setAiFileError] = useState('');
  const [aiFiles, setAiFiles] = useState([]);
  const [aiPastedText, setAiPastedText] = useState('');
  const [isDesktopUpload, setIsDesktopUpload] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const isGeneratingVisible = useDelayedSpinner(isGenerating, 1000);
  const aiSliderRef = useRef(null);

  const aiFileInputId = 'ai-generate-file-input';

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/', { replace: true });
      return;
    }
    apiRequest('/account/user')
      .then((res) => setClasses(res.classes || []))
      .catch(() => navigate('/', { replace: true }));
  }, [navigate]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const update = () => setIsDesktopUpload(window.innerWidth >= 650);

    update();

    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!aiSliderRef.current) {
      return;
    }

    const min = 5;
    const max = 75;
    const progress = ((aiCardCount - min) / (max - min)) * 100;
    aiSliderRef.current.style.setProperty('--ai-slider-progress', `${progress}%`);
  }, [aiCardCount, isAiOpen]);

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

  const applyParsedCards = (rawText) => {
    const parsed = parseImport(rawText);

    if (parsed.length === 0) {
      setImportFeedback('No cards found. Check the format and try again.');
      setImportFeedbackIsError(true);
      setAiFeedback('No cards found. Check the format and try again.');
      setAiFeedbackIsError(true);
      return;
    }

    setCards(parsed.map((card, index) => ({ id: index + 1, ...card })));
    setImportFeedback(`✓ Imported ${parsed.length} card${parsed.length === 1 ? '' : 's'}`);
    setImportFeedbackIsError(false);
    return parsed.length;
  };

  const handleImport = () => {
    applyParsedCards(importText);
  };

  const MAX_FILE_SIZE = 15 * 1024 * 1024;

  const addAiFiles = (newFiles) => {
    const fileArray = Array.from(newFiles || []);
    const oversized = fileArray.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setAiFileError(`"${oversized.name}" is too large (${(oversized.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 15 MB.`);
      const input = document.getElementById(aiFileInputId);
      if (input) input.value = '';
      return;
    }
    setAiFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const deduped = fileArray.filter((f) => !existingNames.has(f.name));
      return [...prev, ...deduped];
    });
    setAiFileError('');
    setAiFeedback('');
    setAiFeedbackIsError(false);
    const input = document.getElementById(aiFileInputId);
    if (input) input.value = '';
  };

  const removeAiFile = (name) => {
    setAiFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleSelectAiFile = (event) => {
    addAiFiles(event.target.files);
  };

  const handleGenerateCards = async () => {
    if (aiFiles.length === 0 && !aiPastedText.trim()) {
      setAiFeedback('Please upload a file or paste some text first.');
      setAiFeedbackIsError(true);
      return;
    }

    const requestedCardCount = Number(aiCardCount);

    if (!aiAutoCardCount && (!Number.isInteger(requestedCardCount) || requestedCardCount <= 0)) {
      setAiFeedback('Please choose a valid card count.');
      setAiFeedbackIsError(true);
      return;
    }

    if (isGenerating) {
      return;
    }

    setIsGenerating(true);
    setAiFeedback('');
    setAiFeedbackIsError(false);

    try {
      const formData = new FormData();
      for (const file of aiFiles) formData.append('files', file);
      if (aiPastedText.trim()) formData.append('pastedText', aiPastedText.trim());
      formData.append('cardCount', aiAutoCardCount ? 'auto' : String(requestedCardCount));

      if (aiNotes.trim()) {
        formData.append('notes', aiNotes.trim());
      }

      const responseText = await apiRequest('/stack/generate', {
        method: 'POST',
        body: formData,
      });

      const normalizedImportText = String(responseText || '')
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n');

      const importedCount = applyParsedCards(normalizedImportText);

      if (importedCount) {
        setImportText(normalizedImportText);
        setAiFeedback(`✓ Generated ${importedCount} card${importedCount === 1 ? '' : 's'}`);
        setAiFeedbackIsError(false);
      }
    } catch (err) {
      setAiFeedback(err?.message || 'Failed to generate cards. Please try again.');
      setAiFeedbackIsError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDropAiFile = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    addAiFiles(event.dataTransfer.files);
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
    setSelectedClassId(initialSelectedClassId);
    setIsCreatingClass(false);
    setNewClassName('');
  };

  const handleSaveStack = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let classId = selectedClassId || null;

      if (isCreatingClass) {
        if (!newClassName.trim()) {
          setFeedback('Please enter a name for the new class.');
          setIsSaving(false);
          return;
        }
        const created = await apiRequest('/class/create', {
          method: 'POST',
          body: JSON.stringify({ name: newClassName.trim() }),
        });
        classId = created?.data?._id || null;
      }

      const payload = {
        name: stackName.trim(),
        classId,
        cards: cards.map((card) => ({ term: card.term, definition: card.definition })),
      };

      await apiRequest(isEditing ? '/stack/update' : '/stack/create', {
        method: 'POST',
        body: JSON.stringify(isEditing ? { stackId: editingStackId, ...payload } : payload),
      });
      handleCloseModal();
      navigate(isEditing ? `/stack/${editingStackId}` : '/home');
    } catch (err) {
      setFeedback(err.message || 'Failed to save stack. Please try again.');
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="new-stack-page">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: isEditing ? 'Edit Stack' : 'New Stack' },
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
              <ol className="import-steps">
                <li>Go to your Quizlet flashcard set (you must be the owner)</li>
                <li>Click the <strong>⋯</strong> menu in the upper right</li>
                <li>Click <strong>Export</strong></li>
                <li>Under <em>Between term and definition</em>, select <strong>Comma</strong></li>
                <li>Copy the text, then paste it below</li>
              </ol>
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
              {importFeedback && <p className={`import-feedback ${importFeedbackIsError ? 'ai-file-error' : ''}`}>{importFeedback}</p>}
            </div>
          )}
        </section>

        <section className={`import-section ${isAiOpen ? 'open' : 'collapsed'}`}>
          <button
            type="button"
            className="import-toggle"
            onClick={() => setIsAiOpen((prev) => !prev)}
          >
            <span>Generate with AI</span>
            <span className="import-chevron">
              <FontAwesomeIcon icon={faChevronDown} />
            </span>
          </button>
          {isAiOpen && (
            <div className="import-body">
              <p className="new-stack-modal-subtitle">Upload class materials and have AI generate cards for you!</p>

              <input
                id={aiFileInputId}
                type="file"
                accept="application/pdf,image/*,text/plain,.txt,.md,.csv"
                multiple
                onChange={handleSelectAiFile}
                className="ai-upload-hidden-input"
              />

              {isDesktopUpload ? (
                <div
                  className={`import-textarea ai-upload-dropzone ${isDragOver ? 'ai-upload-dropzone-dragover' : ''}`}
                  role="button"
                  tabIndex={0}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDropAiFile}
                  onClick={() => document.getElementById(aiFileInputId)?.click()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      document.getElementById(aiFileInputId)?.click();
                    }
                  }}
                >
                  <span>Drop PDFs, images, or text files here</span>
                </div>
              ) : (
                <div className="ai-file-select-row">
                  <button
                    type="button"
                    className="import-button"
                    onClick={() => document.getElementById(aiFileInputId)?.click()}
                  >
                    Choose Files
                  </button>
                </div>
              )}

              {isDesktopUpload && (
                <div className="import-actions">
                  <button
                    type="button"
                    className="import-button"
                    onClick={() => document.getElementById(aiFileInputId)?.click()}
                  >
                    Browse Files
                  </button>
                </div>
              )}

              {aiFiles.length > 0 && (
                <ul className="ai-file-list">
                  {aiFiles.map((file) => (
                    <li key={file.name} className="ai-file-list-item">
                      <span className="ai-file-list-name">{file.name}</span>
                      <button
                        type="button"
                        className="ai-file-list-remove"
                        onClick={() => removeAiFile(file.name)}
                        aria-label={`Remove ${file.name}`}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {aiFileError && <p className="import-feedback ai-file-error">{aiFileError}</p>}

              <p className="ai-or-separator">- or paste text below -</p>
              <textarea
                className="import-textarea ai-paste-input"
                value={aiPastedText}
                onChange={(event) => setAiPastedText(event.target.value)}
                placeholder="Paste your notes or study material here"
              />

              <div className="ai-card-count-wrap">
                <div className="ai-card-count-heading-row">
                  <p className="new-stack-modal-subtitle ai-card-count-label">
                    Cards to generate: {aiAutoCardCount ? 'Auto' : aiCardCount}
                  </p>
                  <label className="ai-card-count-auto-toggle">
                    <input
                      type="checkbox" className="ai-card-count-auto-checkbox"
                      checked={aiAutoCardCount}
                      onChange={(event) => setAiAutoCardCount(event.target.checked)}
                    />
                    Auto
                  </label>
                </div>
                {!aiAutoCardCount && (
                  <input
                    ref={aiSliderRef}
                    className="ai-card-count-slider"
                    type="range"
                    min="5"
                    max="75"
                    step="5"
                    value={aiCardCount}
                    onChange={(event) => setAiCardCount(Number(event.target.value))}
                  />
                )}
              </div>

              <textarea
                className="import-textarea ai-notes-input"
                value={aiNotes}
                onChange={(event) => setAiNotes(event.target.value)}
                placeholder="Additional notes for AI (optional)"
              />

              <div className="import-actions">
                <button type="button" className="import-button" onClick={handleGenerateCards} disabled={isGenerating}>
                  Generate
                </button>
              </div>

              {isGeneratingVisible && (
                <div className="import-feedback generating-loader">
                  <span>Generating cards</span>
                  <span className="generating-dots">
                    <span />
                    <span />
                    <span />
                  </span>
                </div>
              )}
              {aiFeedback && <p className={`import-feedback ${aiFeedbackIsError ? 'ai-file-error' : ''}`}>{aiFeedback}</p>}
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

          <button type="button" className="save-stack-button" onClick={isEditing ? handleSaveStack : handleOpenModal}>
            {isEditing ? 'Save' : 'Add to...'}
          </button>
        </section>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Add to Class">
        <p className="new-stack-modal-subtitle">Select a class or save without one</p>

        <div className="new-stack-modal-classes-grid">
          {classes.map((cls) => (
            <button
              key={cls._id}
              className={`new-stack-modal-class-button ${!isCreatingClass && selectedClassId === cls._id ? 'selected' : ''}`}
              type="button"
              onClick={() => { setSelectedClassId(cls._id); setIsCreatingClass(false); }}
            >
              {cls.name}
            </button>
          ))}
          <button
            className={`new-stack-modal-class-button-new-class ${isCreatingClass ? 'selected' : ''}`}
            type="button"
            onClick={() => { setIsCreatingClass(true); setSelectedClassId(null); }}
          >
            + New Class
          </button>
        </div>

        {isCreatingClass && (
          <input
            className="new-stack-modal-class-name-input"
            type="text"
            placeholder="Class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            autoFocus
          />
        )}

        <div className="new-stack-modal-actions">
          <button type="button" className="new-stack-modal-cancel-button" onClick={handleCloseModal}>
            Cancel
          </button>
          <button type="button" className="new-stack-modal-save-button" onClick={handleSaveStack} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Stack'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default NewStack;