// Create this as components/DiffViewer.jsx

import React, { useState } from 'react';
import './DiffViewer.css'; // Import the CSS we created above

const DiffViewer = ({ diffData, onApplyChanges, onClose }) => {
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  
  if (!diffData || !diffData.diff) {
    return null;
  }
  
  const { diff, stats } = diffData;
  
  return (
    <div className={`diff-container ${compactMode ? 'diff-compact' : ''}`}>
      <div className="diff-header">
        <h4 className="diff-title">🔍 AI Code Changes</h4>
        <div className="diff-controls">
          <div className="diff-stats">
            {stats.additions > 0 && (
              <div className="diff-stat additions">
                <span className="diff-stat-icon">+</span>
                <span>{stats.additions} additions</span>
              </div>
            )}
            {stats.deletions > 0 && (
              <div className="diff-stat deletions">
                <span className="diff-stat-icon">-</span>
                <span>{stats.deletions} deletions</span>
              </div>
            )}
          </div>
          <div className="diff-options">
            <button
              className={`diff-toggle ${showLineNumbers ? 'active' : ''}`}
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              title="Toggle line numbers"
            >
              #
            </button>
            <button
              className={`diff-toggle ${compactMode ? 'active' : ''}`}
              onClick={() => setCompactMode(!compactMode)}
              title="Toggle compact mode"
            >
              ⊟
            </button>
          </div>
        </div>
      </div>
      
      <div className={`diff-content ${showLineNumbers ? 'with-line-numbers' : ''}`}>
        {diff.map((line, index) => (
          <div
            key={line.key || index}
            className={line.className}
          >
            {showLineNumbers && (
              <span className="line-number">{line.lineNumber}</span>
            )}
            <span className="line-content">{line.line}</span>
          </div>
        ))}
      </div>
      
      <div className="diff-footer">
        <div className="diff-actions">
          <button
            className="btn btn-primary"
            onClick={() => onApplyChanges(diffData.modified)}
          >
            ✅ Apply Changes
          </button>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            ❌ Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;