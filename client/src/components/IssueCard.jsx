// client/src/components/IssueCard.jsx
import React from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import './IssueCard.css';

const IssueCard = ({ title, issues, suggestions, onFix, expanded, onToggle }) => {
  const hasIssues = issues && issues.length > 0;
  const hasSuggestions = suggestions && suggestions.length > 0;
  
  if (!hasIssues && !hasSuggestions) return null;

  return (
    <div className="issue-card">
      <div className="issue-header" onClick={onToggle}>
        <h4>{title}</h4>
        <div className="issue-header-right">
          {hasIssues && (
            <span className="issue-count">{issues.length} issues</span>
          )}
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>
      
      {expanded && (
        <div className="issue-content">
          {hasIssues && (
            <div className="issues-list">
              <h5>Issues:</h5>
              <ul>
                {issues.map((issue, index) => (
                  <li key={index} className="issue-item">
                    <span className="issue-text">{issue}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className="btn btn-primary btn-sm fix-btn"
                onClick={() => onFix(issues)}
              >
                <Wrench size={14} />
                Auto-Fix Issues
              </button>
            </div>
          )}
          
          {hasSuggestions && (
            <div className="suggestions-list">
              <h5>Suggestions:</h5>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueCard;