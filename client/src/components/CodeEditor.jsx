import React, { useState } from 'react';
import { Copy, Check, X, RotateCcw, FileText, Wand2, Eye, GitCompare } from 'lucide-react';
import './CodeEditor.css';

// DiffViewer Component (inline for simplicity)
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
            ❌ Close Diff
          </button>
        </div>
      </div>
    </div>
  );
};

const CodeEditor = ({ 
  code, 
  onChange, 
  codeType, 
  loading,
  fixedCode,
  showFixedCode,
  onShowFixedCodeChange,
  onApplyFix
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('original'); // 'original', 'fixed', 'split', 'diff'

  // Handle fixed code - it might be a string or an object with diffData
  const isFixedCodeObject = fixedCode && typeof fixedCode === 'object' && fixedCode.code;
  const actualFixedCode = isFixedCodeObject ? fixedCode.code : fixedCode;
  const diffData = isFixedCodeObject ? fixedCode.diffData : null;

  const handleCopy = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleApplyFix = () => {
    onApplyFix(actualFixedCode);
    setViewMode('original');
  };

  const handleDiscardFix = () => {
    onShowFixedCodeChange(false);
    setViewMode('original');
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Get the appropriate language for syntax highlighting
  const getLanguage = () => {
    switch (codeType) {
      case 'javascript':
        return 'javascript';
      case 'jsx':
        return 'javascript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'mixed':
        return 'html';
      default:
        return 'text';
    }
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <div className="editor-tabs">
          <button 
            className={`editor-tab ${viewMode === 'original' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('original')}
          >
            <FileText size={16} />
            Original Code
          </button>
          
          {showFixedCode && (
            <>
              <button 
                className={`editor-tab ${viewMode === 'fixed' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('fixed')}
              >
                <Wand2 size={16} />
                AI Fixed Code
                {diffData && (
                  <span className="change-indicator">
                    {diffData.stats.additions + diffData.stats.deletions} changes
                  </span>
                )}
              </button>

              <button 
                className={`editor-tab ${viewMode === 'split' ? 'active' : ''}`}
                onClick={() => handleViewModeChange('split')}
              >
                <Eye size={16} />
                Side by Side
              </button>

              {diffData && (
                <button 
                  className={`editor-tab diff-tab ${viewMode === 'diff' ? 'active' : ''}`}
                  onClick={() => handleViewModeChange('diff')}
                >
                  <GitCompare size={16} />
                  Show Changes
                  <span className="diff-badge">
                    +{diffData.stats.additions} -{diffData.stats.deletions}
                  </span>
                </button>
              )}
            </>
          )}
        </div>

        <div className="editor-actions">
          {showFixedCode && viewMode !== 'diff' && (
            <>
              <button 
                className="btn btn-success btn-sm"
                onClick={handleApplyFix}
                title="Apply the AI fixes to your original code"
              >
                <Check size={14} />
                Apply Fixes
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={handleDiscardFix}
                title="Discard AI fixes and keep original"
              >
                <X size={14} />
                Discard
              </button>
            </>
          )}
          
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => handleCopy(viewMode === 'fixed' ? actualFixedCode : code)}
            title="Copy code to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        {viewMode === 'original' && (
          // Original Code Editor
          <div className="editor-pane">
            <div className="editor-info">
              <span className="file-type">{codeType.toUpperCase()}</span>
              <span className="line-count">
                {code.split('\n').length} lines
              </span>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Paste your ${codeType} code here...

Examples:
• React Component (.jsx)
• HTML page
• CSS stylesheet
• Vue component
• Complete website code`}
              className={`code-textarea ${getLanguage()}`}
              disabled={loading}
              spellCheck="false"
            />
          </div>
        )}

        {viewMode === 'fixed' && showFixedCode && (
          // Fixed Code View
          <div className="editor-pane">
            <div className="editor-info">
              <span className="file-type">{codeType.toUpperCase()} - AI ENHANCED</span>
              <span className="line-count">
                {actualFixedCode.split('\n').length} lines
              </span>
              {diffData && (
                <span className="changes-summary">
                  +{diffData.stats.additions} -{diffData.stats.deletions}
                </span>
              )}
            </div>
            
            <textarea
              value={actualFixedCode}
              onChange={() => {/* Read-only */}}
              className={`code-textarea ${getLanguage()} fixed-code`}
              readOnly
              spellCheck="false"
            />
          </div>
        )}

        {viewMode === 'split' && showFixedCode && (
          // Split View: Original and Fixed Code
          <div className="split-view">
            <div className="editor-pane original-pane">
              <div className="pane-header">
                <h4>Original Code</h4>
                <span className="line-count">
                  {code.split('\n').length} lines
                </span>
              </div>
              
              <textarea
                value={code}
                onChange={(e) => onChange(e.target.value)}
                className={`code-textarea ${getLanguage()}`}
                disabled={loading}
                spellCheck="false"
              />
            </div>

            <div className="editor-divider">
              <div className="divider-line"></div>
              <div className="divider-icon">
                <Wand2 size={16} />
              </div>
            </div>

            <div className="editor-pane fixed-pane">
              <div className="pane-header">
                <h4>AI Fixed Code</h4>
                <span className="line-count">
                  {actualFixedCode.split('\n').length} lines
                </span>
                <span className="changes-badge">AI Enhanced</span>
              </div>
              
              <textarea
                value={actualFixedCode}
                onChange={() => {/* Read-only */}}
                className={`code-textarea ${getLanguage()} fixed-code`}
                readOnly
                spellCheck="false"
              />
            </div>
          </div>
        )}

        {viewMode === 'diff' && diffData && (
          // Diff View with highlighting
          <DiffViewer
            diffData={diffData}
            onApplyChanges={handleApplyFix}
            onClose={() => handleViewModeChange('fixed')}
          />
        )}
      </div>

      {loading && (
        <div className="editor-loading">
          <div className="loading-spinner"></div>
          <span>Processing code...</span>
        </div>
      )}

      {showFixedCode && viewMode !== 'diff' && (
        <div className="fix-actions">
          <div className="fix-info">
            <Wand2 size={16} />
            <span>
              AI has generated fixes for your code. 
              {diffData && ` Found ${diffData.stats.additions} additions and ${diffData.stats.deletions} deletions.`}
              {diffData && viewMode !== 'diff' && (
                <button 
                  className="link-button"
                  onClick={() => handleViewModeChange('diff')}
                >
                  View detailed changes →
                </button>
              )}
            </span>
          </div>
          
          <div className="action-buttons">
            <button 
              className="btn btn-primary"
              onClick={handleApplyFix}
            >
              <Check size={16} />
              Apply All Fixes
            </button>
            
            <button 
              className="btn btn-secondary"
              onClick={() => handleCopy(actualFixedCode)}
            >
              <Copy size={16} />
              Copy Fixed Code
            </button>

            {diffData && (
              <button 
                className="btn btn-outline"
                onClick={() => handleViewModeChange('diff')}
              >
                <GitCompare size={16} />
                Show Diff
              </button>
            )}
            
            <button 
              className="btn btn-outline"
              onClick={handleDiscardFix}
            >
              <RotateCcw size={16} />
              Back to Original
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;