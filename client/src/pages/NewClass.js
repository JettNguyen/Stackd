import React from 'react';
import { useNavigate } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import './NewClass.css';

const NewClass = () => {
  const navigate = useNavigate();

  return (
    <div className="new-class-page">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/home' },
          { label: 'New Class' },
        ]}
      />
      <h1>Create New Class</h1>
      <button type="button" onClick={() => navigate('/home')}>
        Back to Home
      </button>
      <p>todo</p>
    </div>
  );
};

export default NewClass;