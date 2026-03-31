import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faFolder } from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../components/Breadcrumbs';
import { apiRequest } from '../utils/api';
import './NewClass.css';


const NewClass = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialClassName = location.state?.className ?? '';

  const [className, setClassName] = useState(initialClassName);
  const [isStacksOpen, setIsStacksOpen] = useState(false);
  const [selectedStackIds, setSelectedStackIds] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    apiRequest('/account/user')
      .then((res) => setStacks(res.stacks || []))
      .catch(() => setStacks([]));
  }, []);

  const selectedStacks = stacks.filter((stack) => selectedStackIds.includes(stack._id));

  const toggleStackSelection = (stackId) => {
    setSelectedStackIds((prev) =>
      prev.includes(stackId) ? prev.filter((id) => id !== stackId) : [...prev, stackId]
    );
  };

  const handleCreateClass = async () => {
    if (!className.trim()) {
      setFeedback('Please enter a class name.');
      return;
    }
    setIsSaving(true);
    setFeedback('');
    try {
      await apiRequest('/class/create', {
        method: 'POST',
        body: JSON.stringify({ name: className.trim() }),
      });
      navigate('/home');
    } catch (err) {
      setFeedback(err.message || 'Failed to create class.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="new-class-page">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: 'New Class' },
        ]}
      />
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
                const isSelected = selectedStackIds.includes(stack._id);
                return (
                  <button
                    key={stack._id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`stack-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleStackSelection(stack._id)}
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
        {feedback && <div className="new-class-feedback">{feedback}</div>}
        <button
          className="confirm-class-button"
          type="button"
          onClick={handleCreateClass}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
};

export default NewClass;
