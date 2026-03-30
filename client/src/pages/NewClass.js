import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronLeft, faUser, faFolder } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import './NewClass.css';

const NewClass = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialClassName = location.state?.className ?? '';

  const [className, setClassName] = useState(initialClassName);
  const [isStacksOpen, setIsStacksOpen] = useState(false);
  const [selectedStackIds, setSelectedStackIds] = useState([]);
  
  const stacks = useMemo(
    () => [
      { id: 1, name: 'Midterm' },
      { id: 2, name: 'Final' },
      { id: 3, name: 'Module 5' },
      { id: 4, name: 'Unit 6 Vocabulary' },
      { id: 5, name: 'Module 4' },
      { id: 6, name: 'Module 3' },
      { id: 7, name: 'Module 1' },
      { id: 8, name: 'Module 2' },
    ],
    []
  );

  const selectedStacks = useMemo(
    () => stacks.filter((stack) => selectedStackIds.includes(stack.id)),
    [stacks, selectedStackIds]
  );

  const handleBack = () => {
    navigate(-1);
  };

  const toggleStackSelection = (stackId) => {
    setSelectedStackIds((prev) =>
      prev.includes(stackId) ? prev.filter((id) => id !== stackId) : [...prev, stackId]
    );
  };

  return (
    <div className="new-class-page">
      <header className="new-class-header">
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

      <div className="new-class-content">
        <div className="class-preview">
          <div className="new-class-card">
            <div className="folder-wrapper">
              <FontAwesomeIcon icon={faFolder} className="folder-icon" />
            </div>
            <span>{className || 'Class Name'}</span>
          </div>
        </div>

        <div className="class-name-row">
          <label htmlFor="class-name-input">Name:</label>
          <input
            id="class-name-input"
            className="class-name-input"
            type="text"
            value={className}
            onChange={(event) => setClassName(event.target.value)}
            placeholder="Class Name"
          />
        </div>
        <section className={`stacks-section ${isStacksOpen ? 'open' : 'collapsed'}`}>
          <button
            type="button"
            className="stacks-toggle"
            onClick={() => setIsStacksOpen((prev) => !prev)}
          >
            <span>Add Stacks:</span>
            <span className="stacks-chevron">
              <FontAwesomeIcon icon={faChevronDown} />
            </span>
          </button>

          <div className="stacks-summary">
            {selectedStacks.length === 0
              ? 'Select one or more stacks'
              : selectedStacks.map((stack) => stack.name).join(', ')}
          </div>

          {isStacksOpen && (
            <div className="stacks-menu" role="listbox" aria-multiselectable="true">
              {stacks.map((stack) => {
                const isSelected = selectedStackIds.includes(stack.id);
                return (
                  <button
                    key={stack.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`stack-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleStackSelection(stack.id)}
                  >
                    <span className="stack-option-name">{stack.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="new-class-actions-bar">
        <button className="confirm-class-button" type="button">
          Confirm
        </button>
      </div>
    </div>
  );
};

export default NewClass;
