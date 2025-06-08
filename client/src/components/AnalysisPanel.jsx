import React from 'react';
import './AnalysisPanel.css';

const AnalysisPanel = ({ analysis, onFix, activeTab, onTabChange }) => {
  console.log('🎯 AnalysisPanel received analysis:', analysis);
  console.log('🔍 Current active tab:', activeTab);

  if (!analysis) {
    return (
      <div className="analysis-panel">
        <p>No analysis data available.</p>
      </div>
    );
  }

  return (
    <div className="analysis-panel">
      <div className="analysis-header">
        <div className="header-content">
          <h2>SEO Analysis Results</h2>
          <div className="overall-score">
            <div className="score-circle">
              <span className="score-number">{analysis.overallScore || 0}</span>
            </div>
            <div className="score-info">
              <p className="score-description">
                {analysis.overallScore >= 80 ? 'Excellent SEO' : 
                 analysis.overallScore >= 60 ? 'Good SEO' : 
                 'Needs significant SEO improvements'}
              </p>
              <p className="analyzed-date">
                Analyzed: {analysis.timestamp ? new Date(analysis.timestamp).toLocaleDateString() : 'Invalid Date'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="analysis-tabs">
        <button 
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => onTabChange('analysis')}
        >
          Analysis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => onTabChange('recommendations')}
        >
          Recommendations
        </button>
        <button 
          className={`tab-btn ${activeTab === 'lighthouse' ? 'active' : ''}`}
          onClick={() => onTabChange('lighthouse')}
        >
          Lighthouse
        </button>
      </div>

      <div className="analysis-content">
        {activeTab === 'analysis' && (
          <AnalysisTab analysis={analysis} onFix={onFix} />
        )}
        
        {activeTab === 'recommendations' && (
          <RecommendationsTab analysis={analysis} />
        )}
        
        {activeTab === 'lighthouse' && (
          <LighthouseTab lighthouseData={analysis.lighthouse} />
        )}
      </div>
    </div>
  );
};

// Analysis Tab Component
const AnalysisTab = ({ analysis, onFix }) => {
  if (!analysis.issues || analysis.issues.length === 0) {
    return (
      <div className="tab-content">
        <p>No issues found in your code. Great job! 🎉</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="issues-list">
        {analysis.issues.map((issue, index) => (
          <div key={index} className={`issue-item ${issue.severity}`}>
            <div className="issue-header">
              <h3>{issue.title}</h3>
              <span className={`severity-badge ${issue.severity}`}>
                {issue.severity}
              </span>
            </div>
            <p className="issue-description">{issue.description}</p>
            {issue.recommendation && (
              <div className="issue-recommendation">
                <strong>Recommendation:</strong> {issue.recommendation}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {analysis.issues.length > 0 && (
        <button 
          className="fix-btn"
          onClick={() => onFix(analysis.issues)}
        >
          🔧 Auto-Fix Issues
        </button>
      )}
    </div>
  );
};

// Recommendations Tab Component
const RecommendationsTab = ({ analysis }) => {
  return (
    <div className="tab-content">
      <div className="recommendations-section">
        <h3>SEO Recommendations</h3>
        <div className="recommendation-item">
          <h4>Meta Description</h4>
          <p>Add a compelling meta description to improve click-through rates from search results.</p>
        </div>
        <div className="recommendation-item">
          <h4>Title Tag</h4>
          <p>Ensure your title tag is descriptive and under 60 characters.</p>
        </div>
        <div className="recommendation-item">
          <h4>Heading Structure</h4>
          <p>Use proper heading hierarchy (H1, H2, H3) to organize your content.</p>
        </div>
      </div>
    </div>
  );
};

// Lighthouse Tab Component
const LighthouseTab = ({ lighthouseData }) => {
  console.log('🔍 LighthouseTab received data:', lighthouseData);
  
  if (!lighthouseData) {
    return (
      <div className="tab-content">
        <div className="lighthouse-placeholder">
          <h3>No Lighthouse Analysis Available</h3>
          <p>Use the sidebar to analyze a live website URL with Lighthouse.</p>
        </div>
      </div>
    );
  }

  // Extract scores with multiple fallback methods
  const getScore = (category) => {
    const score = lighthouseData[category]?.score || 
                  lighthouseData[`${category}Score`] || 
                  lighthouseData.categories?.[category]?.score ||
                  0;
    console.log(`Score for ${category}:`, score);
    return score;
  };

  const performanceScore = getScore('performance');
  const seoScore = getScore('seo');
  const accessibilityScore = getScore('accessibility');
  const bestPracticesScore = getScore('bestPractices');

  console.log('📊 Final scores for display:', {
    performance: performanceScore,
    seo: seoScore,
    accessibility: accessibilityScore,
    bestPractices: bestPracticesScore
  });

  return (
    <div className="tab-content">
      <div className="lighthouse-analysis">
        <h3>Lighthouse Analysis</h3>
        <div className="lighthouse-url">
          <p>Analyzed: {lighthouseData.url}</p>
          <p>Time: {new Date(lighthouseData.timestamp).toLocaleString()}</p>
        </div>

        <div className="lighthouse-scores">
          <div className="score-item">
            <div className="score-circle">
              <span className="score-number">{performanceScore}</span>
            </div>
            <span className="score-label">Performance</span>
          </div>

          <div className="score-item">
            <div className="score-circle">
              <span className="score-number">{seoScore}</span>
            </div>
            <span className="score-label">SEO</span>
          </div>

          <div className="score-item">
            <div className="score-circle">
              <span className="score-number">{accessibilityScore}</span>
            </div>
            <span className="score-label">Accessibility</span>
          </div>

          <div className="score-item">
            <div className="score-circle">
              <span className="score-number">{bestPracticesScore}</span>
            </div>
            <span className="score-label">Best Practices</span>
          </div>
        </div>

        {/* Performance Opportunities */}
        {lighthouseData.opportunities && lighthouseData.opportunities.length > 0 && (
          <div className="opportunities-section">
            <h4>Performance Opportunities</h4>
            {lighthouseData.opportunities.map((opportunity, index) => (
              <div key={index} className="opportunity-item">
                <h5>{opportunity.title}</h5>
                <p>{opportunity.description}</p>
                {opportunity.displayValue && (
                  <span className="savings">Potential savings: {opportunity.displayValue}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Diagnostics */}
        {lighthouseData.diagnostics && lighthouseData.diagnostics.length > 0 && (
          <div className="diagnostics-section">
            <h4>Diagnostics</h4>
            {lighthouseData.diagnostics.map((diagnostic, index) => (
              <div key={index} className="diagnostic-item">
                <h5>{diagnostic.title}</h5>
                <p>{diagnostic.description}</p>
                {diagnostic.displayValue && (
                  <span className="value">{diagnostic.displayValue}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Debug Info for Development */}
        {/* Debug section removed for cleaner UI */}
      </div>
    </div>
  );
};

export default AnalysisPanel;