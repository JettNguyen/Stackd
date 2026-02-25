import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPlus, faArrowRight, faArrowLeft, faFolder } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [showMoreStacks, setShowMoreStacks] = useState(false);
  const [showMoreClasses, setShowMoreClasses] = useState(false);

  const stacks = [
    { id: 1, name: 'Midterm', class: 'HCI' },
    { id: 2, name: 'Final', class: 'HCI' },
    { id: 3, name: 'Module 5', class: 'Internet Programming' },
    { id: 4, name: 'Unit 6 Vocabulary', class: 'AP HuG' },
    { id: 5, name: 'Module 4', class: 'Internet Programming' },
    { id: 6, name: 'Module 3', class: 'Internet Programming' },
    { id: 7, name: 'Module 1', class: 'Internet Programming' },
    { id: 8, name: 'Module 2', class: 'Internet Programming' },
  ];

  const classes = [
    { id: 1, name: 'HCI', stackCount: 3 },
    { id: 2, name: 'Internet Programming', stackCount: 5 },
    { id: 3, name: 'Networks', stackCount: 0 },
    { id: 4, name: 'AP HuG', stackCount: 2 },
  ];

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Stackd Logo" className="logo-image" />
          <h1 className="logo-text">Stackd</h1>
        </div>
        <button className="profile-button">
          <FontAwesomeIcon icon={faUser} />
        </button>
      </header>

      <section className="stacks-section">
        <div className="section-header">
          <h2>Your Stacks</h2>
          <button className="add-button" onClick={() => navigate('/stack/new')}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className={`cards-grid ${showMoreStacks ? 'show-all' : ''}`}>
          {stacks.map((stack) => (
            <div 
              key={stack.id} 
              className="stack-card"
              onClick={() => navigate(`/stack/${stack.id}`)}
            >
              <div className="stack-layer-back"></div>
              <div className="stack-layer-middle"></div>
              <div className="stack-layer-front">
                <div className="stack-content">
                  <span className="stack-name">{stack.name}</span>
                  {stack.class && <span className="stack-class-label">{stack.class}</span>}
                </div>
              </div>
            </div>
          ))}
          {stacks.length > 5 && (
            <button className="see-more-button" onClick={() => setShowMoreStacks(!showMoreStacks)}>
              <FontAwesomeIcon icon={showMoreStacks ? faArrowLeft : faArrowRight} className="arrow-icon" />
              <span>{showMoreStacks ? 'see less' : 'see more'}</span>
            </button>
          )}
        </div>
      </section>

      <section className="classes-section">
        <div className="section-header">
          <h2>Your Classes</h2>
          <button className="add-button">
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
        <div className={`cards-grid ${showMoreClasses ? 'show-all' : ''}`}>
          {classes.map((classItem) => (
            <div 
              key={classItem.id} 
              className="class-card"
              onClick={() => navigate(`/class/${classItem.id}`)}
            >
              <div className="folder-wrapper">
                <FontAwesomeIcon icon={faFolder} className="folder-icon" />
                {classItem.stackCount > 0 && (
                  <span className="stack-badge">{classItem.stackCount}</span>
                )}
              </div>
              <span className="class-name">{classItem.name}</span>
            </div>
          ))}
          {classes.length > 5 && (
            <button className="see-more-button" onClick={() => setShowMoreClasses(!showMoreClasses)}>
              <FontAwesomeIcon icon={showMoreClasses ? faArrowLeft : faArrowRight} className="arrow-icon" />
              <span>{showMoreClasses ? 'see less' : 'see more'}</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
