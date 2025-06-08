import React, { useState } from 'react';
import { Copy, Check, X, RotateCcw, FileText, Wand2 } from 'lucide-react';
import './CodeEditor.css';

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
  const [activePane, setActivePane] = useState('original'); // 'original' or 'fixed'

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
    onApplyFix(fixedCode);
  };

  const handleDiscardFix = () => {
    onShowFixedCodeChange(false);
  };

  // Get the appropriate language for syntax highlighting
  const getLanguage = () => {
    switch (codeType) {
      case 'javascript':
        return 'javascript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'mixed':
        return 'html'; // Default to HTML for mixed content
      default:
        return 'text';
    }
  };

  return (
    <div className="code-editor">
      <div className="editor-header">
        <div className="editor-tabs">
          <button 
            className={`editor-tab ${!showFixedCode ? 'active' : ''}`}
            onClick={() => onShowFixedCodeChange(false)}
          >
            <FileText size={16} />
            Original Code
          </button>
          
          {showFixedCode && (
            <button 
              className={`editor-tab ${showFixedCode ? 'active' : ''}`}
              onClick={() => onShowFixedCodeChange(true)}
            >
              <Wand2 size={16} />
              AI Fixed Code
              <span className="tab-badge">New</span>
            </button>
          )}
        </div>

        <div className="editor-actions">
          {showFixedCode && (
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
            onClick={() => handleCopy(showFixedCode ? fixedCode : code)}
            title="Copy code to clipboard"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        {!showFixedCode ? (
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
        ) : (
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
                  {fixedCode.split('\n').length} lines
                </span>
                <span className="changes-badge">AI Enhanced</span>
              </div>
              
              <textarea
                value={fixedCode}
                onChange={(e) => {/* Read-only for now */}}
                className={`code-textarea ${getLanguage()} fixed-code`}
                readOnly
                spellCheck="false"
              />
            </div>
          </div>
        )}
      </div>

      {showFixedCode && (
        <div className="fix-actions">
          <div className="fix-info">
            <Wand2 size={16} />
            <span>AI has generated fixes for your code. Review the changes and apply if you're satisfied.</span>
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
              onClick={() => handleCopy(fixedCode)}
            >
              <Copy size={16} />
              Copy Fixed Code
            </button>
            
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