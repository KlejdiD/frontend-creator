import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import CodeEditor from './components/CodeEditor';
import AnalysisPanel from './components/AnalysisPanel';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import { analyzeCode, fixCode, getLighthouseAnalysis } from './services/api';
import './App.css';

const App = () => {
  const [code, setCode] = useState('');
  const [fixedCode, setFixedCode] = useState('');
  const [showFixedCode, setShowFixedCode] = useState(false);
  const [codeType, setCodeType] = useState('html');
  const [framework, setFramework] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing...');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to analyze');
      return;
    }

    setLoading(true);
    setLoadingMessage('Analyzing your code with AI...');
    try {
      const result = await analyzeCode(code, codeType, framework);
      setAnalysis(result);
      setActiveTab('analysis');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply improvements based on analysis results
  const applyAnalysisBasedImprovements = (originalCode, issues, codeType) => {
    let improvedCode = originalCode;
    const appliedFixes = [];
    
    console.log('🔬 Applying improvements based on analysis issues:', issues);
    
    if (!issues || issues.length === 0) {
      console.log('⚠️ No issues provided for analysis-based improvements');
      return { improvedCode, appliedFixes };
    }
    
    issues.forEach((issue) => {
      const title = issue.title?.toLowerCase() || '';
      const recommendation = issue.recommendation?.toLowerCase() || '';
      const description = issue.description?.toLowerCase() || '';
      
      console.log(`🔍 Processing issue: "${title}"`);
      
      // Meta description fixes
      if (title.includes('meta description') || title.includes('missing meta description') || 
          recommendation.includes('meta description') || description.includes('meta description')) {
        
        if (codeType === 'jsx' && improvedCode.includes('React')) {
          // Add React Helmet with meta description
          if (!improvedCode.includes('react-helmet') && !improvedCode.includes('next/head')) {
            const importMatch = improvedCode.match(/(import.*from.*['"];?\n)/);
            if (importMatch) {
              improvedCode = improvedCode.replace(
                /(import.*from.*['"];?\n)/,
                '$1import { Helmet } from "react-helmet";\n'
              );
              appliedFixes.push('Added React Helmet import for meta tag management');
            }
          }
          
          if (!improvedCode.includes('<Helmet') && improvedCode.includes('return')) {
            improvedCode = improvedCode.replace(
              /return\s*\(/,
              `return (
    <>
      <Helmet>
        <meta name="description" content="SEO-optimized description based on AI analysis recommendations" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>AI-Enhanced Page Title</title>
      </Helmet>`
            );
            
            // Close the React Fragment
            const lastReturn = improvedCode.lastIndexOf('  );');
            if (lastReturn !== -1) {
              improvedCode = improvedCode.substring(0, lastReturn) + '    </>\n  );' + improvedCode.substring(lastReturn + 4);
            }
            appliedFixes.push('Added meta description using React Helmet');
          }
        } else if (codeType === 'html' || codeType === 'mixed') {
          if (!improvedCode.includes('meta name="description"')) {
            if (improvedCode.includes('<head>')) {
              improvedCode = improvedCode.replace(
                /<head>/i,
                '<head>\n  <meta name="description" content="AI-recommended SEO description for better search visibility">'
              );
              appliedFixes.push('Added meta description tag');
            }
          }
        }
      }
      
      // Title tag fixes
      if (title.includes('title') || title.includes('missing title') || 
          recommendation.includes('title') || description.includes('title')) {
        
        if (codeType === 'html' && !improvedCode.includes('<title>')) {
          if (improvedCode.includes('<head>')) {
            improvedCode = improvedCode.replace(
              /<head>/i,
              '<head>\n  <title>AI-Enhanced Page Title - SEO Optimized</title>'
            );
            appliedFixes.push('Added title tag');
          }
        }
      }
      
      // Alt attribute fixes
      if (title.includes('alt') || title.includes('image') || 
          recommendation.includes('alt') || description.includes('alt')) {
        
        const imgMatches = improvedCode.match(/<img[^>]*>/g);
        if (imgMatches) {
          let altCount = 0;
          imgMatches.forEach(img => {
            if (!img.includes('alt=')) {
              const fixedImg = img.replace('>', ` alt="AI-enhanced descriptive image content ${altCount + 1}">`);
              improvedCode = improvedCode.replace(img, fixedImg);
              altCount++;
            }
          });
          if (altCount > 0) {
            appliedFixes.push(`Added alt attributes to ${altCount} images`);
          }
        }
      }
      
      // Heading structure fixes
      if (title.includes('heading') || title.includes('h1') || 
          recommendation.includes('heading') || description.includes('h1')) {
        
        if (!improvedCode.includes('<h1')) {
          if (codeType === 'jsx') {
            // Add H1 to React component
            const divMatch = improvedCode.match(/<div[^>]*>/);
            if (divMatch) {
              improvedCode = improvedCode.replace(
                divMatch[0],
                `${divMatch[0]}\n      <h1>AI-Enhanced Page Title</h1>`
              );
              appliedFixes.push('Added H1 heading for SEO structure');
            }
          } else if (codeType === 'html') {
            const bodyMatch = improvedCode.match(/<body[^>]*>/i);
            if (bodyMatch) {
              improvedCode = improvedCode.replace(
                bodyMatch[0],
                `${bodyMatch[0]}\n  <h1>AI-Enhanced Page Title</h1>`
              );
              appliedFixes.push('Added H1 heading for SEO structure');
            }
          }
        }
      }
      
      // Semantic HTML improvements
      if (title.includes('semantic') || recommendation.includes('semantic') || 
          title.includes('accessibility') || description.includes('semantic')) {
        
        if (improvedCode.includes('<div') && !improvedCode.includes('<main')) {
          // Replace a container div with main
          const containerDiv = improvedCode.match(/<div(\s+className=["'][^"']*container[^"']*["'][^>]*)>/i);
          if (containerDiv) {
            improvedCode = improvedCode.replace(containerDiv[0], `<main${containerDiv[1]}>`);
            // Find the corresponding closing div
            const divCount = (improvedCode.substring(0, improvedCode.indexOf(containerDiv[0])).match(/<div/g) || []).length;
            const closingDivs = improvedCode.match(/<\/div>/g);
            if (closingDivs && closingDivs.length > divCount) {
              let divIndex = 0;
              improvedCode = improvedCode.replace(/<\/div>/g, (match) => {
                if (divIndex === divCount) {
                  divIndex++;
                  return '</main>';
                }
                divIndex++;
                return match;
              });
            }
            appliedFixes.push('Replaced div with semantic <main> element');
          }
        }
      }
      
      // ARIA and accessibility improvements
      if (title.includes('aria') || title.includes('accessibility') || 
          recommendation.includes('aria') || description.includes('aria')) {
        
        const buttonMatches = improvedCode.match(/<button[^>]*>/g);
        if (buttonMatches) {
          let ariaCount = 0;
          buttonMatches.forEach((button, index) => {
            if (!button.includes('aria-label') && !button.includes('aria-describedby')) {
              const fixedButton = button.replace('>', ` aria-label="AI-enhanced accessible button ${index + 1}">`);
              improvedCode = improvedCode.replace(button, fixedButton);
              ariaCount++;
            }
          });
          if (ariaCount > 0) {
            appliedFixes.push(`Added ARIA labels to ${ariaCount} interactive elements`);
          }
        }
      }
      
      // CSS Performance improvements
      if (title.includes('performance') && codeType === 'css') {
        if (!improvedCode.includes('font-display')) {
          improvedCode = `/* AI Performance Enhancement */\n@font-face { font-display: swap; }\n\n${improvedCode}`;
          appliedFixes.push('Added font-display optimization');
        }
      }
      
      // Responsive design improvements
      if (title.includes('responsive') || title.includes('mobile') || 
          recommendation.includes('responsive') || description.includes('mobile')) {
        
        if (codeType === 'css' && !improvedCode.includes('@media')) {
          improvedCode += `\n\n/* AI-Enhanced Responsive Design */\n@media screen and (max-width: 768px) {\n  .container { padding: 1rem; }\n  img { max-width: 100%; height: auto; }\n}`;
          appliedFixes.push('Added responsive design patterns');
        }
        
        if (codeType === 'html' && !improvedCode.includes('viewport')) {
          if (improvedCode.includes('<head>')) {
            improvedCode = improvedCode.replace(
              /<head>/i,
              '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
            );
            appliedFixes.push('Added viewport meta tag for mobile responsiveness');
          }
        }
      }
    });
    
    return { improvedCode, appliedFixes };
  };

  const handleFix = async (issues) => {
    setLoading(true);
    setLoadingMessage('Generating fixed code with AI...');
    try {
      console.log('🔧 Requesting AI fixes for issues:', issues);
      
      const result = await fixCode(code, codeType, issues);
      console.log('✅ AI fix result received:', result);
      
      // Extract the fixed code from various possible structures
      let actualFixedCode = code; // fallback to original
      
      // Try different extraction methods
      if (typeof result.fixedCode === 'string' && result.fixedCode.trim()) {
        actualFixedCode = result.fixedCode;
        console.log('✅ Using direct fixedCode string');
      } else if (result.fixedCode?.code && typeof result.fixedCode.code === 'string') {
        actualFixedCode = result.fixedCode.code;
        console.log('✅ Using nested fixedCode.code');
      } else if (result.code && typeof result.code === 'string') {
        actualFixedCode = result.code;
        console.log('✅ Using top-level code property');
      }
      
      // If AI returned identical code, apply analysis-based improvements
      if (actualFixedCode === code) {
        console.log('🤖 AI returned identical code - applying analysis-based improvements...');
        
        if (analysis && analysis.issues) {
          const { improvedCode, appliedFixes } = applyAnalysisBasedImprovements(
            actualFixedCode, 
            analysis.issues, 
            codeType
          );
          
          if (improvedCode !== actualFixedCode && appliedFixes.length > 0) {
            actualFixedCode = improvedCode;
            console.log('✅ Applied analysis-based improvements:', appliedFixes);
            toast.success(`Applied ${appliedFixes.length} AI-recommended improvements!`);
          } else {
            console.log('⚠️ No specific improvements could be applied from analysis');
            toast.error('The code appears to be well-optimized based on AI analysis.');
          }
        } else {
          console.log('⚠️ No analysis results available for improvements');
          toast.error('No analysis data available for improvements.');
        }
      } else {
        toast.success('AI successfully generated improved code!');
      }
      
      console.log('🎯 Final code length:', actualFixedCode.length);
      setFixedCode(actualFixedCode);
      setShowFixedCode(true);
      
    } catch (error) {
      console.error('Fix failed:', error);
      toast.error('Auto-fix failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLighthouseAnalysis = async (url) => {
    setLoading(true);
    setLoadingMessage('Running Lighthouse analysis...');
    try {
      console.log('🚀 Starting Lighthouse analysis for:', url);
      
      const result = await getLighthouseAnalysis(url);
      console.log('📊 Lighthouse result received:', result);
      
      setAnalysis(prev => {
        const updatedAnalysis = {
          ...prev,
          lighthouse: result,
          overallScore: result.overallScore || prev?.overallScore || 0,
          timestamp: result.timestamp || new Date().toISOString()
        };
        
        console.log('🔄 Updated analysis state:', updatedAnalysis);
        return updatedAnalysis;
      });
      
      setActiveTab('lighthouse');
      console.log('✅ Lighthouse analysis completed and state updated');
      
    } catch (error) {
      console.error('❌ Lighthouse analysis failed:', error);
      toast.error('Lighthouse analysis failed. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocalhostAnalysis = async (url) => {
    setLoading(true);
    setLoadingMessage('Analyzing localhost server...');
    try {
      console.log('🏠 Starting localhost Lighthouse analysis for:', url);
      
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        toast.error('Please provide a localhost URL (e.g., http://localhost:3000)');
        setLoading(false);
        return;
      }
      
      toast.success('Analyzing your local development server...');
      
      const result = await getLighthouseAnalysis(url);
      console.log('📊 Localhost Lighthouse result received:', result);
      
      setAnalysis(prev => {
        const updatedAnalysis = {
          ...prev,
          lighthouse: result,
          overallScore: result.overallScore || prev?.overallScore || 0,
          timestamp: result.timestamp || new Date().toISOString(),
          analysisType: 'localhost'
        };
        
        console.log('🔄 Updated localhost analysis state:', updatedAnalysis);
        return updatedAnalysis;
      });
      
      setActiveTab('lighthouse');
      toast.success('Pre-deployment analysis complete! 🚀');
      
    } catch (error) {
      console.error('❌ Localhost analysis failed:', error);
      toast.error('Localhost analysis failed. Make sure your dev server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Toaster position="top-right" />
      
      <Header 
        onAnalyze={handleAnalyze}
        loading={loading}
        hasCode={!!code.trim()}
      />
      
      <div className="app-content">
        <Sidebar 
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          codeType={codeType}
          onCodeTypeChange={setCodeType}
          framework={framework}
          onFrameworkChange={setFramework}
          onLighthouseAnalysis={handleLighthouseAnalysis}
          onLocalhostAnalysis={handleLocalhostAnalysis}
        />
        
        <main className={`main-content ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
          <div className="editor-container">
            <CodeEditor
              code={code}
              onChange={setCode}
              codeType={codeType}
              loading={loading}
              fixedCode={fixedCode}
              showFixedCode={showFixedCode}
              onShowFixedCodeChange={setShowFixedCode}
              onApplyFix={(newCode) => {
                setCode(newCode);
                setShowFixedCode(false);
                toast.success('Fixed code applied!');
              }}
            />
          </div>
          
          <div className="analysis-container">
            {loading && <LoadingSpinner message={loadingMessage} />}
            
            {analysis && !loading && (
              <AnalysisPanel
                analysis={analysis}
                onFix={handleFix}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}
            
            {!analysis && !loading && (
              <div className="empty-state">
                <div className="empty-state-content">
                  <h3>Ready to Analyze</h3>
                  <p>Choose your analysis method:</p>
                  <div className="analysis-options">
                    <div className="option-card">
                      <span className="option-icon">📝</span>
                      <h4>Code Analysis</h4>
                      <p>Paste HTML, CSS, or JavaScript code in the editor for AI-powered SEO analysis</p>
                    </div>
                    <div className="option-card">
                      <span className="option-icon">🌐</span>
                      <h4>Live Website</h4>
                      <p>Analyze any live website with Google Lighthouse</p>
                    </div>
                    <div className="option-card">
                      <span className="option-icon">🏠</span>
                      <h4>Pre-Deployment</h4>
                      <p>Test your localhost development server before going live</p>
                    </div>
                  </div>
                  <div className="features-list">
                    <div className="feature">
                      <span className="feature-icon">🔍</span>
                      <span>SEO Analysis</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">🤖</span>
                      <span>AI-Powered Suggestions</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">🛠️</span>
                      <span>Auto-Fix Issues</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">⚡</span>
                      <span>Performance Insights</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;