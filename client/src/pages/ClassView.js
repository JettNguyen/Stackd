import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faFolder, faUser } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import { getClassById, getOrInitMockData, getSessionUsername, getStacksForClassId } from '../utils/mockData';
import Breadcrumbs from '../components/Breadcrumbs';
import { apiRequest } from '../utils/api';
import './Home.css';
import './ClassView.css';

const ClassView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [classItem, setClassItem] = useState(null);
  const [stacks, setStacks] = useState([]);

  useEffect(() => {
    const username = getSessionUsername();
    if (!username) {
      navigate('/', { replace: true });
      return;
    }

    let isMounted = true;

    const loadClass = async () => {
      try {
        const response = await apiRequest(`/class/view?class=${id}`);
        if (!isMounted) {
          return;
        }

        setClassItem({ id, name: response?.name || 'Class' });
        setStacks(
          (response?.stacks || []).map((stack) => ({
            id: stack._id,
            name: stack.name,
            className: response?.name || '',
          }))
        );
      } catch {
        getOrInitMockData(username);
        if (!isMounted) {
          return;
        }

        const currentClass = getClassById(id);
        setClassItem(currentClass);
        setStacks(getStacksForClassId(id));
      }
    };

    loadClass();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (!classItem) {
    return (
      <div className="class-view-page">
        <div className="class-view-content">
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/home' },
              { label: 'Class' },
            ]}
          />
          <h1>Class not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="class-view-page">
      <header className="class-view-header">
        <button className="back-button" onClick={() => navigate(-1)}>
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

      <div className="class-view-content">
        <Breadcrumbs
          items={[
            { label: 'Home', to: '/home' },
            { label: classItem.name || 'Class' },
          ]}
        />
        <div className="class-view-hero">
          <div className="folder-wrapper class-view-folder-wrapper">
            <FontAwesomeIcon icon={faFolder} className="folder-icon" />
            {stacks.length > 0 && <span className="stack-badge">{stacks.length}</span>}
          </div>
          <h2>{classItem.name}</h2>
        </div>

        <section className="class-view-section">
          <div className="section-header">
            <h2>Stacks in Class</h2>
          </div>

          {stacks.length > 0 ? (
            <div className="cards-grid show-all">
              {stacks.map((stack) => (
                <div key={stack.id} className="stack-card" onClick={() => navigate(`/stack/${stack.id}`)}>
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
            </div>
          ) : (
            <p className="class-view-empty">No stacks in this class yet.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default ClassView;