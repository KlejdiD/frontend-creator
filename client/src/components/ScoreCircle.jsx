
// client/src/components/ScoreCircle.jsx
import React from 'react';
import './ScoreCircle.css';

const ScoreCircle = ({ score, size = 80, color }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score) => {
    if (color) return color;
    if (score >= 80) return '#4ade80';
    if (score >= 60) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div className="score-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(score)}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="score-progress"
        />
      </svg>
      <span className="score-text">{Math.round(score)}</span>
    </div>
  );
};

export default ScoreCircle;