import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Analyzing..." }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <div className="loading-text">
          <h3>{message}</h3>
          <p>This may take a moment...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;