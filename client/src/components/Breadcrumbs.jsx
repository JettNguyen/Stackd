import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Breadcrumbs.css';

const Breadcrumbs = ({ items }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="breadcrumbs-item">
            {item.to && !isLast ? (
              <button type="button" className="breadcrumbs-link" onClick={() => navigate(item.to)}>
                {item.label}
              </button>
            ) : (
              <span className="breadcrumbs-current" aria-current={isLast ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="breadcrumbs-separator">/</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;