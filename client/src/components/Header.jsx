// client/src/components/Header.jsx
import React from 'react';
import { Play, Loader } from 'lucide-react';
import './Header.css';

const Header = ({ onAnalyze, loading, hasCode }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>Frontend SEO Analyzer</h1>
          <p>AI-powered SEO analysis for your frontend code</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-primary analyze-btn"
            onClick={onAnalyze}
            disabled={loading || !hasCode}
          >
            {loading ? (
              <>
                <Loader className="spinning" size={16} />
                Analyzing...
              </>
            ) : (
              <>
                <Play size={16} />
                Analyze Code
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;