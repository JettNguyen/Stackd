import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder } from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../components/Breadcrumbs';
import { apiRequest, getAuthToken } from '../utils/api';
import './NewClass.css';


const NewClass = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialClassName = location.state?.className ?? '';

  const [className, setClassName] = useState(initialClassName);
  const [stacks, setStacks] = useState([]);
  const [selectedStackIds, setSelectedStackIds] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/', { replace: true });
      return;
    }

    let isMounted = true;

    const loadStacks = async () => {
      try {
        const response = await apiRequest('/account/user');

        if (!isMounted) return;

        const accountStacks = Array.isArray(response?.stacks) ? response.stacks : [];
        setStacks(
          accountStacks.map((stack) => ({ id: stack._id, name: stack.name }))
        );
      } catch {
        if (isMounted) setStacks([]);
      }
    };

    loadStacks();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const selectedStacks = stacks.filter((stack) => selectedStackIds.includes(stack.id));

  const toggleStackSelection = (stackId) => {
    setSelectedStackIds((prev) =>
      prev.includes(stackId) ? prev.filter((id) => id !== stackId) : [...prev, stackId]
    );
  };

  const handleCreateClass = async () => {
    const name = className.trim();

    if (!name) {
      setFeedback('Please enter a class name before saving.');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    setFeedback('');

    try {
      const response = await apiRequest('/class/create', {
        method: 'POST',
        body: JSON.stringify({ name, stackIds: selectedStackIds }),
      });

      const classId = response?.data?._id;

      if (classId) {
        navigate(`/class/${classId}`);
      } else {
        navigate('/home');
      }
    } catch (error) {
      setFeedback(error?.message || 'Unable to create class right now.');
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

        <section className={`stacks-section ${stacks.length > 0 ? 'open' : 'collapsed'}`}>
          <div className="stacks-summary">
            {selectedStacks.length === 0
              ? 'Select one or more stacks'
              : selectedStacks.map((stack) => stack.name).join(', ')}
          </div>

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
        </section>

        {feedback && <p className="new-class-feedback">{feedback}</p>}
      </div>

      <div className="new-class-actions-bar">
        <button className="confirm-class-button" type="button" onClick={handleCreateClass} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Confirm'}
        </button>
      </div>
    </div>
  );
};

export default NewClass;
