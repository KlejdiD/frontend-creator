import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ 
  isOpen, 
  onToggle, 
  codeType, 
  onCodeTypeChange, 
  framework, 
  onFrameworkChange, 
  onLighthouseAnalysis,
  onLocalhostAnalysis 
}) => {
  const [lighthouseUrl, setLighthouseUrl] = useState('');
  const [localhostUrl, setLocalhostUrl] = useState('http://localhost:3000');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLighthouseSubmit = async (e) => {
    e.preventDefault();
    if (!lighthouseUrl.trim()) {
      alert('Please enter a URL to analyze');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      await onLighthouseAnalysis(lighthouseUrl);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLocalhostSubmit = async (e) => {
    e.preventDefault();
    if (!localhostUrl.trim()) {
      alert('Please enter a localhost URL');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      await onLocalhostAnalysis(localhostUrl);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const commonPorts = [
    { port: 3000, framework: 'React (Create React App)' },
    { port: 5173, framework: 'Vite' },
    { port: 8080, framework: 'Vue CLI' },
    { port: 4200, framework: 'Angular' },
    { port: 3001, framework: 'Next.js' },
    { port: 8000, framework: 'Django/Python' },
    { port: 5000, framework: 'Flask/Node.js' },
  ];

  if (!isOpen) {
    return (
      <div className="sidebar collapsed">
        <button className="sidebar-toggle" onClick={onToggle}>
          ☰
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>SEO Analyzer</h2>
        <button className="sidebar-toggle" onClick={onToggle}>
          ✕
        </button>
      </div>

      <div className="sidebar-content">
        {/* Code Analysis Section */}
        <div className="sidebar-section">
          <h3>📝 Code Analysis</h3>
          <div className="form-group">
            <label htmlFor="projectType">What are you analyzing?</label>
            <select
              id="projectType"
              value={`${codeType}-${framework || 'none'}`}
              onChange={(e) => {
                const [type, fw] = e.target.value.split('-');
                onCodeTypeChange(type);
                onFrameworkChange(fw === 'none' ? '' : fw);
              }}
              className="select-input"
            >
              <optgroup label="🌐 Website & Pages">
                <option value="html-none">HTML Page</option>
                <option value="html-static">Static Website</option>
                <option value="mixed-none">Complete Website (HTML+CSS+JS)</option>
              </optgroup>
              
              <optgroup label="⚛️ React Files">
                <option value="javascript-react">React Component (.jsx)</option>
                <option value="html-react">React App's index.html</option>
                <option value="javascript-react">React App.js/main component</option>
              </optgroup>
              
              <optgroup label="🟢 Vue Files">
                <option value="javascript-vue">Vue Component (.vue)</option>
                <option value="html-vue">Vue App's index.html</option>
                <option value="javascript-vue">Vue main.js/root component</option>
              </optgroup>
              
              <optgroup label="🅰️ Angular Files">
                <option value="javascript-angular">Angular Component</option>
                <option value="html-angular">Angular index.html</option>
                <option value="javascript-angular">Angular app.component.ts</option>
              </optgroup>
              
              <optgroup label="🎨 Styles & Scripts">
                <option value="css-none">CSS Stylesheet</option>
                <option value="javascript-none">JavaScript File</option>
              </optgroup>
              
              <optgroup label="🚀 Other Frameworks">
                <option value="mixed-svelte">Svelte Application</option>
                <option value="mixed-gatsby">Gatsby Site</option>
                <option value="mixed-nuxt">Nuxt.js Project</option>
              </optgroup>
            </select>
          </div>
          
          <div className="analysis-tip">
            <p>💡 <strong>Paste a single file's content in the editor.</strong></p>
            <p>For best results:</p>
            <ul>
              <li><strong>Components:</strong> Copy the entire .jsx/.vue/.ts file</li>
              <li><strong>HTML:</strong> Copy your main index.html file</li>
              <li><strong>CSS:</strong> Copy your main stylesheet</li>
              <li><strong>Complete Website:</strong> Copy your main HTML with inline CSS/JS</li>
            </ul>
          </div>
        </div>

        {/* Live Website Analysis Section */}
        <div className="sidebar-section">
          <h3>🌐 Live Website Analysis</h3>
          <form onSubmit={handleLighthouseSubmit} className="url-form">
            <div className="form-group">
              <label htmlFor="lighthouseUrl">Website URL</label>
              <input
                id="lighthouseUrl"
                type="url"
                value={lighthouseUrl}
                onChange={(e) => setLighthouseUrl(e.target.value)}
                placeholder="https://example.com"
                className="text-input"
                disabled={isAnalyzing}
              />
            </div>
            <button
              type="submit"
              className="analyze-btn"
              disabled={isAnalyzing || !lighthouseUrl.trim()}
            >
              {isAnalyzing ? '🔍 Analyzing...' : '🚀 Analyze Website'}
            </button>
          </form>
          <div className="help-text">
            <p>Analyze any live website with Google Lighthouse for performance, SEO, and accessibility insights.</p>
          </div>
        </div>

        {/* Pre-Deployment Analysis Section */}
        <div className="sidebar-section localhost-section">
          <h3>🏠 Pre-Deployment Analysis</h3>
          <div className="localhost-intro">
            <p><strong>Test before you deploy!</strong></p>
            <p>Analyze your local development server to catch issues before going live.</p>
          </div>
          
          <form onSubmit={handleLocalhostSubmit} className="url-form">
            <div className="form-group">
              <label htmlFor="localhostUrl">Localhost URL</label>
              <input
                id="localhostUrl"
                type="url"
                value={localhostUrl}
                onChange={(e) => setLocalhostUrl(e.target.value)}
                placeholder="http://localhost:3000"
                className="text-input"
                disabled={isAnalyzing}
              />
            </div>
            <button
              type="submit"
              className="analyze-btn localhost-btn"
              disabled={isAnalyzing || !localhostUrl.trim()}
            >
              {isAnalyzing ? '🔍 Analyzing...' : '🏠 Analyze Localhost'}
            </button>
          </form>

          {/* Quick Port Buttons */}
          <div className="quick-ports">
            <p className="ports-label">Common Development Ports:</p>
            <div className="ports-grid">
              {commonPorts.slice(0, 4).map(({ port, framework }) => (
                <button
                  key={port}
                  className="port-btn"
                  onClick={() => setLocalhostUrl(`http://localhost:${port}`)}
                  disabled={isAnalyzing}
                  title={framework}
                >
                  :{port}
                </button>
              ))}
            </div>
          </div>

          {/* Development Tips */}
          <div className="dev-tips">
            <details className="tips-section">
              <summary>💡 Setup Tips</summary>
              <div className="tips-content">
                <div className="tip-item">
                  <strong>React:</strong> <code>npm start</code> → http://localhost:3000
                </div>
                <div className="tip-item">
                  <strong>Vite:</strong> <code>npm run dev</code> → http://localhost:5173
                </div>
                <div className="tip-item">
                  <strong>Next.js:</strong> <code>npm run dev</code> → http://localhost:3000
                </div>
                <div className="tip-item">
                  <strong>Vue:</strong> <code>npm run serve</code> → http://localhost:8080
                </div>
              </div>
            </details>
          </div>

          <div className="localhost-benefits">
            <h4>✨ Pre-Deployment Benefits:</h4>
            <ul>
              <li>🐛 Catch SEO issues early</li>
              <li>⚡ Test performance locally</li>
              <li>🔍 Validate before hosting</li>
              <li>💰 Save deployment costs</li>
            </ul>
          </div>
        </div>

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="analysis-status">
            <div className="status-indicator">
              <div className="spinner"></div>
              <span>Running analysis...</span>
            </div>
            <p className="status-note">This may take 30-60 seconds</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;