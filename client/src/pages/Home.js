import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPlus, faArrowRight, faArrowLeft, faFolder } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import { getOrInitMockData, getSessionUsername } from '../utils/mockData';
import Breadcrumbs from '../components/Breadcrumbs';
import { apiRequest, clearAuthToken } from '../utils/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [showMoreStacks, setShowMoreStacks] = useState(false);
  const [showMoreClasses, setShowMoreClasses] = useState(false);
  const [classes, setClasses] = useState([]);
  const [stacks, setStacks] = useState([]);

  useEffect(() => {
    const username = getSessionUsername();
    if (!username) {
      navigate('/', { replace: true });
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const response = await apiRequest('/account/user');
        if (!isMounted) {
          return;
        }

        const apiClasses = Array.isArray(response?.classes) ? response.classes : [];
        const apiStacks = Array.isArray(response?.stacks) ? response.stacks : [];

        setClasses(
          apiClasses.map((item) => ({
            id: item._id,
            name: item.name,
            stackCount: Number(item.stackCount || 0),
          }))
        );

        setStacks(
          apiStacks.map((item) => ({
            id: item._id,
            name: item.name,
            className: item.className || '',
          }))
        );
      } catch (error) {
        if (error?.status === 401 || error?.status === 400) {
          clearAuthToken();
        }

        const data = getOrInitMockData(username);
        if (!isMounted) {
          return;
        }

        setStacks(data.stacks);
        setClasses(
          data.classes.map((item) => ({
            ...item,
            stackCount: data.stacks.filter((stack) => String(stack.classId) === String(item.id)).length,
          }))
        );
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="logo" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Stackd Logo" className="logo-image" />
          <h1 className="logo-text">Stackd</h1>
        </div>
        <button className="profile-button" onClick={() => navigate('/profile')}>
          <FontAwesomeIcon icon={faUser} />
        </button>
      </header>
      <Breadcrumbs items={[{ label: 'Home' }]} />

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
                  {stack.className && <span className="stack-class-label">{stack.className}</span>}
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
          <button className="add-button" onClick={() => navigate('/class/new')}>
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
