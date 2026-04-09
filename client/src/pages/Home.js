import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useDelayedSpinner from '../utils/useDelayedSpinner';
import { faPlus, faArrowRight, faArrowLeft, faFolder } from '@fortawesome/free-solid-svg-icons';
import Breadcrumbs from '../components/Breadcrumbs';
import { apiRequest, clearAuthToken, getAuthToken } from '../utils/api';
import './Home.css';

const getCollapsedCardCount = () => {
  if (typeof window === 'undefined') return 3;
  if (window.innerWidth >= 1250) return 7;
  if (window.innerWidth >= 650) return 5;
  return 3;
};

const Home = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collapsedCardCount, setCollapsedCardCount] = useState(getCollapsedCardCount);
  const [areStacksExpanded, setAreStacksExpanded] = useState(false);
  const [areClassesExpanded, setAreClassesExpanded] = useState(false);
  const isLoadingVisible = useDelayedSpinner(isLoading, 1000);

  useEffect(() => {
    const handleResize = () => {
      setCollapsedCardCount(getCollapsedCardCount());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [collapsedCardCount]);

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/', { replace: true });
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      if (isMounted) setIsLoading(true);

      try {
        const response = await apiRequest('/account/user');
        if (!isMounted) return;

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
          if (isMounted) navigate('/', { replace: true });
          return;
        }
        if (!isMounted) return;
        setStacks([]);
        setClasses([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const visibleStacks = areStacksExpanded ? stacks : stacks.slice(0, collapsedCardCount);
  const visibleClasses = areClassesExpanded ? classes : classes.slice(0, collapsedCardCount);
  const hasMoreStacks = stacks.length > collapsedCardCount;
  const hasMoreClasses = classes.length > collapsedCardCount;

  return (
    <div className="home-page">
      {isLoading ? (
        isLoadingVisible ? (
          <div className="home-loading" role="status" aria-live="polite">
            <div className="home-loading-spinner"></div>
            <p>Loading home...</p>
          </div>
        ) : (
          <div className="home-loading-delayed-placeholder" aria-hidden="true" />
        )
      ) : (
        <div className="content-appear">
          <Breadcrumbs items={[{ label: 'Home' }]} />
          <section className="stacks-section">
            <div className="section-header">
              <h2>Your Stacks</h2>
              <button className="add-button" onClick={() => navigate('/stack/new')}>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            {stacks.length === 0 ? (
              <div className="home-empty-state">
                <p>No stacks yet. Add your first!</p>
              </div>
            ) : (
              <div className={`cards-grid ${!hasMoreStacks ? 'show-all' : ''}`}>
                {visibleStacks.map((stack) => (
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
                {hasMoreStacks && (
                  <button
                    className="see-more-button"
                    onClick={() => setAreStacksExpanded((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={areStacksExpanded ? faArrowLeft : faArrowRight} className="arrow-icon" />
                    <span>{areStacksExpanded ? 'see less' : 'see more'}</span>
                  </button>
                )}
              </div>
            )}
          </section>

          <section className="classes-section">
            <div className="section-header">
              <h2>Your Classes</h2>
              <button className="add-button" onClick={() => navigate('/class/new')}>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            {classes.length === 0 ? (
              <div className="home-empty-state">
                <p>No classes yet. Add your first!</p>
              </div>
            ) : (
              <div className={`cards-grid ${!hasMoreClasses ? 'show-all' : ''}`}>
                {visibleClasses.map((classItem) => (
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
                {hasMoreClasses && (
                  <button
                    className="see-more-button"
                    onClick={() => setAreClassesExpanded((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={areClassesExpanded ? faArrowLeft : faArrowRight} className="arrow-icon" />
                    <span>{areClassesExpanded ? 'see less' : 'see more'}</span>
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Home;
