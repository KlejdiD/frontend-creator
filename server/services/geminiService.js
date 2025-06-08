const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required");
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.initializeModel();
  }

  async initializeModel() {
    const modelOptions = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-1.0-pro",
      "gemini-pro",
    ];

    for (const modelName of modelOptions) {
      try {
        console.log(`🧪 Trying model: ${modelName}`);
        this.model = this.genAI.getGenerativeModel({ model: modelName });

        // Test the model with a simple request
        const testResult = await this.model.generateContent("Hello");
        console.log(
          `✅ Gemini service initialized successfully with model: ${modelName}`
        );
        this.modelName = modelName;
        return;
      } catch (error) {
        console.log(`❌ Model ${modelName} failed:`, error.message);
        continue;
      }
    }

    throw new Error("No working Gemini model found");
  }

  async analyzeCodeForSEO(code, codeType, framework, automatedAnalysis) {
    try {
      if (!this.model) {
        await this.initializeModel();
      }

      // Validate and correct code type if needed
      const correctedCodeType = this.validateCodeType(code, codeType);

      console.log(
        `🔍 Starting Gemini SEO analysis for ${correctedCodeType} code using ${this.modelName}`
      );

      const prompt = this.createSEOAnalysisPrompt(
        code,
        correctedCodeType,
        framework,
        automatedAnalysis
      );

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("📝 Gemini response received, parsing...");

      const analysis = this.parseGeminiResponse(text);

      console.log("✅ Gemini analysis completed:", {
        overallScore: analysis.overallScore,
        issuesFound: analysis.issues?.length || 0,
        codeType: correctedCodeType,
      });

      return analysis;
    } catch (error) {
      console.error("❌ Gemini analysis failed:", error);
      throw new Error(`Gemini analysis failed: ${error.message}`);
    }
  }

  // ENHANCED: Generate comprehensive code fixes
  async generateComprehensiveCodeFix(code, codeType, framework, issues) {
    try {
      if (!this.model) {
        await this.initializeModel();
      }

      console.log(`🔧 Generating comprehensive code fix for ${codeType}`);

      const prompt = this.createComprehensiveFixPrompt(
        code,
        codeType,
        framework,
        issues
      );

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("📝 Gemini fix response received, parsing...");
      console.log(
        "🔍 Raw AI response preview:",
        text.substring(0, 200) + "..."
      );

      const fixResult = this.parseComprehensiveFixResponse(
        text,
        code,
        codeType
      );

      console.log("✅ Gemini fix parsing completed:", {
        wasModified: fixResult.wasModified,
        fixedCodeType: typeof fixResult.fixedCode,
        fixedCodeLength: fixResult.fixedCode ? fixResult.fixedCode.length : 0,
        suggestionsCount: fixResult.suggestions?.length || 0,
      });

      // CRITICAL FIX: Ensure we return the right structure
      return {
        fixedCode: fixResult.fixedCode, // This MUST be a string
        suggestions: fixResult.suggestions || [],
        wasModified: fixResult.wasModified || false,
      };
    } catch (error) {
      console.error("❌ Gemini comprehensive fix failed:", error);

      // Return fallback improvements instead of just original code
      return this.generateFallbackImprovedCode(code, codeType, [
        {
          title: "AI Fix Failed",
          description: `Gemini API error: ${error.message}`,
          priority: "low",
        },
      ]);
    }
  }

  async generateFixSuggestions(code, codeType, issues) {
    try {
      console.log("🔧 Generating fix suggestions with Gemini");

      const prompt = this.createFixSuggestionsPrompt(code, codeType, issues);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const suggestions = this.parseFixSuggestions(text);

      console.log("✅ Fix suggestions generated:", suggestions.length);

      return suggestions;
    } catch (error) {
      console.error("❌ Fix suggestions failed:", error);
      throw new Error(`Fix suggestions failed: ${error.message}`);
    }
  }

  async getRecommendations(code, codeType, framework, currentIssues) {
    try {
      console.log("💡 Getting SEO recommendations with Gemini");

      const prompt = this.createRecommendationsPrompt(
        code,
        codeType,
        framework,
        currentIssues
      );

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const recommendations = this.parseRecommendations(text);

      console.log("✅ Recommendations generated:", recommendations.length);

      return recommendations;
    } catch (error) {
      console.error("❌ Recommendations failed:", error);
      throw new Error(`Recommendations failed: ${error.message}`);
    }
  }
  // Add this method to your geminiService.js to improve code type detection

  // NEW METHOD: Validate and improve code type detection
  validateCodeType(code, providedCodeType) {
    const detectedType = this.detectActualCodeType(code);

    // If detection differs significantly from provided type, use detected type
    if (detectedType && detectedType !== providedCodeType) {
      console.log(
        `🔍 Code type correction: ${providedCodeType} -> ${detectedType}`
      );
      return detectedType;
    }

    return providedCodeType;
  }

  // NEW METHOD: Detect actual code type from content
  detectActualCodeType(code) {
    const trimmedCode = code.trim().toLowerCase();

    // Pure CSS detection
    if (this.isPureCSS(code)) {
      return "css";
    }

    // Pure JavaScript detection
    if (this.isPureJavaScript(code)) {
      return "javascript";
    }

    // React/JSX detection
    if (this.isReactComponent(code)) {
      return "jsx";
    }

    // Vue component detection
    if (this.isVueComponent(code)) {
      return "vue";
    }

    // HTML detection
    if (this.isHTML(code)) {
      return "html";
    }

    return null; // Keep original type
  }

  // Helper methods for code type detection
  isPureCSS(code) {
    const cssPatterns = [
      /^\s*\/\*[\s\S]*?\*\/\s*/, // CSS comments at start
      /^\s*[.#@][\w-]+\s*{/, // CSS selectors
      /^\s*:root\s*{/, // CSS custom properties
      /^\s*@media\s/, // Media queries
      /^\s*@import\s/, // CSS imports
    ];

    // Check if it starts with CSS patterns
    const startsWithCSS = cssPatterns.some((pattern) => pattern.test(code));

    // Check if it contains no HTML tags or JS keywords
    const hasHTMLTags = /<[^>]+>/g.test(code);
    const hasJSKeywords =
      /\b(function|const|let|var|import|export|class)\b/g.test(code);

    // Additional CSS indicators
    const hasCSSProperties = /[\w-]+\s*:\s*[^{};]+;/g.test(code);
    const hasCSSSelectors = /[.#][\w-]+\s*{/g.test(code);

    return (
      (startsWithCSS || hasCSSProperties || hasCSSSelectors) && !hasHTMLTags
    );
  }

  isPureJavaScript(code) {
    const jsPatterns = [
      /^\s*(const|let|var|function|class|import|export)\b/,
      /^\s*\/\/.*$/m, // JS comments
      /^\s*\/\*[\s\S]*?\*\//,
      /^['"`]use strict['"`];?$/m,
    ];

    const startsWithJS = jsPatterns.some((pattern) => pattern.test(code));
    const hasJSKeywords =
      /\b(function|const|let|var|=>|import|export|class|if|for|while)\b/g.test(
        code
      );
    const hasHTMLTags = /<[^>]+>/g.test(code);

    return (startsWithJS || hasJSKeywords) && !hasHTMLTags;
  }

  isReactComponent(code) {
    const reactPatterns = [
      /import\s+React/,
      /from\s+['"]react['"]/,
      /export\s+default\s+function\s+\w+/,
      /return\s*\(/,
      /className=/,
      /useState|useEffect|useContext/,
    ];

    const hasReactPatterns = reactPatterns.some((pattern) =>
      pattern.test(code)
    );
    const hasJSX = /<[A-Z][\w]*[\s\S]*?>/g.test(code); // JSX components

    return hasReactPatterns || hasJSX;
  }

  isVueComponent(code) {
    const vuePatterns = [
      /<template>/,
      /<script>/,
      /<style>/,
      /export\s+default\s*{/,
      /Vue\.component/,
      /v-if|v-for|v-model/,
    ];

    return vuePatterns.some((pattern) => pattern.test(code));
  }

  isHTML(code) {
    const htmlPatterns = [
      /^\s*<!DOCTYPE\s+html>/i,
      /^\s*<html/i,
      /<head>|<body>|<title>|<meta/,
      /<div|<span|<p>|<h[1-6]>/,
    ];

    return htmlPatterns.some((pattern) => pattern.test(code));
  }

  // Update the analyzeCodeForSEO method to use improved code type detection

  // Replace the createSEOAnalysisPrompt method in your geminiService.js

  createSEOAnalysisPrompt(code, codeType, framework, automatedAnalysis) {
    // Create context-specific analysis based on code type
    const analysisContext = this.getAnalysisContext(code, codeType, framework);

    return `
You are an expert SEO analyst. Analyze the following ${codeType} code for SEO issues and provide a detailed analysis.

${framework ? `Framework: ${framework}` : ""}

IMPORTANT CONTEXT:
${analysisContext}

Code to analyze:
\`\`\`${codeType}
${code}
\`\`\`

Automated analysis results:
${JSON.stringify(automatedAnalysis, null, 2)}

Please provide a JSON response with the following structure:
{
  "overallScore": <number 0-100>,
  "issues": [
    {
      "title": "Issue title",
      "description": "Detailed description",
      "severity": "high|medium|low",
      "recommendation": "How to fix this",
      "line": <line number if applicable>
    }
  ],
  "strengths": [
    {
      "title": "What's done well",
      "description": "Explanation"
    }
  ],
  "summary": "Overall analysis summary"
}

${this.getSpecificFocusAreas(codeType)}

CRITICAL: Only suggest improvements that are relevant to ${codeType} files. Do not suggest HTML-specific features for CSS/JS files.
`;
  }

  // NEW METHOD: Get analysis context based on code type
  getAnalysisContext(code, codeType, framework) {
    switch (codeType.toLowerCase()) {
      case "css":
        return `
This is a CSS stylesheet. Focus ONLY on:
- Performance optimizations (font-display, will-change, efficient selectors)
- Responsive design (media queries, mobile-first approach)
- Accessibility (focus states, contrast, font sizes)
- Modern CSS features (Grid, Flexbox, custom properties)
- Loading performance (critical CSS patterns)

DO NOT suggest HTML meta tags, DOCTYPE, or JavaScript features for CSS files.`;

      case "javascript":
      case "js":
        return `
This is a JavaScript file. Focus ONLY on:
- SEO-blocking patterns (document.write, synchronous scripts)
- Performance (async/defer, code splitting, lazy loading)
- Core Web Vitals impact (DOM manipulation timing)
- Accessibility (ARIA updates, keyboard handling)
- Modern JS practices (ES6+, error handling)

DO NOT suggest HTML meta tags or CSS styles for JavaScript files.`;

      case "jsx":
      case "react":
        return `
This is a React/JSX component. Focus ONLY on:
- SEO-friendly patterns (SSR considerations, meta tag management)
- Accessibility (ARIA attributes, semantic elements, keyboard navigation)
- Performance (component optimization, lazy loading)
- SEO meta management (React Helmet, Next.js Head)
- Semantic HTML usage within JSX

Suggest React-specific solutions, not vanilla HTML changes.`;

      case "html":
      case "mixed":
        return `
This is an HTML document or mixed HTML/CSS/JS. Focus on:
- Document structure (DOCTYPE, meta tags, semantic HTML)
- SEO optimization (title, description, Open Graph, structured data)
- Accessibility (ARIA, alt text, heading hierarchy)
- Performance (resource loading, critical path)
- Mobile responsiveness (viewport, responsive images)

This is the appropriate context for HTML-specific suggestions.`;

      case "vue":
        return `
This is a Vue.js component. Focus ONLY on:
- Vue-specific SEO patterns (Nuxt.js, vue-meta)
- Component accessibility
- Performance optimization
- Vue template best practices

Suggest Vue-specific solutions, not vanilla HTML changes.`;

      default:
        return `
This is a ${codeType} file. Analyze it appropriately for its file type and do not suggest features from other languages or file types.`;
    }
  }

  // NEW METHOD: Get specific focus areas by code type
  getSpecificFocusAreas(codeType) {
    switch (codeType.toLowerCase()) {
      case "css":
        return `
Focus on these CSS-specific SEO factors:
- Font loading performance (font-display: swap)
- Critical CSS patterns
- Responsive design implementation
- Accessibility (focus indicators, sufficient contrast)
- Performance (efficient selectors, avoiding expensive properties)
- Modern CSS features that improve UX
`;

      case "javascript":
      case "js":
        return `
Focus on these JavaScript-specific SEO factors:
- Avoiding SEO-blocking patterns
- Proper DOM manipulation timing
- Performance optimization
- Accessibility event handling
- Modern JavaScript practices
`;

      case "jsx":
      case "react":
        return `
Focus on these React-specific SEO factors:
- Server-side rendering considerations
- Meta tag management (React Helmet)
- Component accessibility
- Performance optimization
- Semantic HTML in JSX
`;

      case "html":
      case "mixed":
        return `
Focus on these HTML-specific SEO factors:
- Document structure and meta tags
- Semantic HTML elements
- Accessibility attributes
- Open Graph and structured data
- Performance and mobile optimization
`;

      default:
        return `
Focus on ${codeType}-specific best practices and avoid suggesting features from other file types.
`;
    }
  }

  // ENHANCED: Create comprehensive fix prompt with better instructions
  createComprehensiveFixPrompt(code, codeType, framework, issues) {
    // Create a more specific prompt based on the code type and issues
    const specificImprovements = this.generateSpecificImprovements(
      code,
      codeType,
      issues
    );

    return `You are an expert web developer. I need you to SIGNIFICANTLY IMPROVE this ${codeType} code by applying SEO and accessibility fixes.

${framework ? `Framework: ${framework}` : ""}

ORIGINAL CODE TO IMPROVE:
\`\`\`${codeType}
${code}
\`\`\`

DETECTED ISSUES TO FIX:
${
  issues && issues.length > 0
    ? issues.map((issue) => `- ${issue.title}: ${issue.description}`).join("\n")
    : "General SEO and accessibility improvements needed"
}

SPECIFIC IMPROVEMENTS TO APPLY:
${specificImprovements}

CRITICAL REQUIREMENTS:
1. You MUST make SUBSTANTIAL improvements to the code
2. DO NOT return the original code unchanged
3. Apply ALL the specific improvements listed above
4. Return ONLY valid JSON in this exact format:

{
  "fixedCode": "COMPLETE_SUBSTANTIALLY_IMPROVED_CODE_HERE",
  "suggestions": [
    {
      "title": "Specific improvement made",
      "description": "What exactly was changed",
      "priority": "high"
    }
  ]
}

MANDATORY IMPROVEMENTS FOR ${codeType.toUpperCase()}:
${this.getMandatoryImprovements(codeType)}

The improved code MUST be significantly different and better than the original. Return ONLY the JSON response.`;
  }

  // NEW METHOD: Generate specific improvements based on code analysis
  generateSpecificImprovements(code, codeType, issues) {
    const improvements = [];

    if (codeType === "html" || codeType === "mixed") {
      if (!code.includes("<!DOCTYPE html>")) {
        improvements.push("Add HTML5 DOCTYPE declaration");
      }
      if (!code.includes("lang=")) {
        improvements.push('Add lang="en" attribute to html tag');
      }
      if (!code.includes('meta name="description"')) {
        improvements.push(
          "Add comprehensive meta description (120-160 characters)"
        );
      }
      if (!code.includes('meta name="viewport"')) {
        improvements.push("Add responsive viewport meta tag");
      }
      if (!code.includes("charset=")) {
        improvements.push("Add UTF-8 charset declaration");
      }
      if (!code.includes("<h1")) {
        improvements.push("Add proper H1 heading for SEO");
      }
      if (!code.includes("alt=")) {
        improvements.push("Add descriptive alt attributes to all images");
      }
      if (!code.includes("<main")) {
        improvements.push("Add semantic <main> element");
      }
      if (!code.includes('property="og:')) {
        improvements.push("Add Open Graph meta tags for social sharing");
      }
      if (
        !code.includes("structured data") &&
        !code.includes("application/ld+json")
      ) {
        improvements.push("Add JSON-LD structured data");
      }
    }

    if (codeType === "css") {
      if (!code.includes("@media")) {
        improvements.push("Add responsive media queries");
      }
      if (!code.includes(":focus")) {
        improvements.push("Add accessibility focus styles");
      }
      if (!code.includes("font-display")) {
        improvements.push("Add font-display: swap for better performance");
      }
    }

    if (codeType === "javascript" || codeType === "jsx") {
      if (code.includes("document.write")) {
        improvements.push("Replace SEO-blocking document.write calls");
      }
      if (!code.includes("DOMContentLoaded") && code.includes("document.")) {
        improvements.push("Wrap DOM operations in DOMContentLoaded");
      }
      if (
        framework === "react" &&
        !code.includes("Helmet") &&
        !code.includes("Head")
      ) {
        improvements.push("Add React Helmet for meta tag management");
      }
    }

    // Add issue-specific improvements
    if (issues && issues.length > 0) {
      issues.forEach((issue) => {
        if (issue.recommendation) {
          improvements.push(issue.recommendation);
        }
      });
    }

    return improvements.length > 0
      ? improvements.join("\n- ")
      : "Apply general SEO and accessibility best practices";
  }

  // NEW METHOD: Get mandatory improvements by code type
  getMandatoryImprovements(codeType) {
    switch (codeType) {
      case "html":
      case "mixed":
        return `
- Add complete HTML5 document structure with DOCTYPE
- Include comprehensive meta tags (description, viewport, charset, Open Graph)
- Add semantic HTML elements (header, main, nav, footer, article, section)
- Ensure proper heading hierarchy (single H1, structured H2-H6)
- Add alt attributes to all images
- Include ARIA labels for accessibility
- Add JSON-LD structured data
- Optimize for Core Web Vitals`;

      case "css":
        return `
- Add responsive design with mobile-first approach
- Include accessibility improvements (focus styles, high contrast)
- Add performance optimizations (font-display, will-change)
- Use modern CSS features (Grid, Flexbox)
- Add dark mode support if applicable`;

      case "javascript":
      case "jsx":
        return `
- Fix SEO-blocking patterns (document.write, synchronous scripts)
- Add proper error handling
- Optimize for performance (lazy loading, code splitting)
- Add accessibility event handlers
- Include meta tag management for SPAs`;

      default:
        return "Apply comprehensive SEO and accessibility improvements";
    }
  }

  createFixSuggestionsPrompt(code, codeType, issues) {
    return `
You are an expert web developer. Provide specific fix suggestions for the following SEO issues in ${codeType} code.

Issues to fix:
${JSON.stringify(issues, null, 2)}

Code:
\`\`\`${codeType}
${code}
\`\`\`

Please provide a JSON response with the following structure:
{
  "suggestions": [
    {
      "issueTitle": "Issue being fixed",
      "priority": "high|medium|low",
      "fixType": "automatic|manual",
      "description": "What needs to be done",
      "codeExample": "Example of fixed code",
      "explanation": "Why this fix improves SEO"
    }
  ]
}

Provide working, copy-paste ready code fixes.
`;
  }

  createRecommendationsPrompt(code, codeType, framework, currentIssues) {
    return `
You are an SEO expert. Provide actionable SEO recommendations for this ${codeType} code.

${framework ? `Framework: ${framework}` : ""}

Current issues found:
${JSON.stringify(currentIssues, null, 2)}

Code:
\`\`\`${codeType}
${code.substring(0, 1000)}...
\`\`\`

Please provide a JSON response with the following structure:
{
  "recommendations": [
    {
      "category": "Technical SEO|Content|Structure|Performance",
      "title": "Recommendation title",
      "description": "Detailed explanation",
      "priority": "high|medium|low",
      "impact": "Description of SEO impact",
      "implementation": "How to implement this"
    }
  ]
}

Focus on actionable, prioritized recommendations.
`;
  }

  // ENHANCED: Parse comprehensive fix response with better validation
  parseComprehensiveFixResponse(text, originalCode, codeType) {
    try {
      console.log("🔍 Parsing Gemini fix response...");
      console.log("📝 Raw response length:", text.length);
      console.log("🎯 Original code length:", originalCode.length);

      // Step 1: Clean the response more aggressively
      let cleanText = text.trim();

      // Remove various markdown patterns
      cleanText = cleanText
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .replace(/^```[\w]*\n?/gim, "")
        .replace(/\n?```$/gm, "")
        .replace(/^Here's the improved code:?\s*/i, "")
        .replace(/^The fixed code is:?\s*/i, "");

      console.log("🧹 Cleaned text preview:", cleanText.substring(0, 300));

      // Step 2: Try to extract and parse JSON
      let parsed = null;

      // Look for JSON object - try multiple patterns
      const jsonPatterns = [
        /\{[\s\S]*"fixedCode"[\s\S]*\}/, // Look specifically for fixedCode
        /\{[\s\S]*\}/, // Any JSON object
      ];

      for (const pattern of jsonPatterns) {
        const match = cleanText.match(pattern);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
            console.log("✅ Successfully parsed JSON from response");
            break;
          } catch (parseError) {
            console.log(
              "❌ JSON parse failed for pattern:",
              parseError.message
            );
            continue;
          }
        }
      }

      // Step 3: Validate and extract the improved code
      if (parsed && parsed.fixedCode) {
        let fixedCode = parsed.fixedCode;

        // Handle nested structure if present
        if (typeof fixedCode === "object" && fixedCode.code) {
          fixedCode = fixedCode.code;
        }

        // Validate that it's a string and significantly different
        if (typeof fixedCode === "string" && fixedCode.trim().length > 0) {
          const wasModified = this.isSignificantlyDifferent(
            fixedCode,
            originalCode
          );

          console.log("📊 Code comparison:", {
            originalLength: originalCode.length,
            fixedCodeLength: fixedCode.length,
            wasModified: wasModified,
            firstDifference: this.findFirstDifference(originalCode, fixedCode),
          });

          if (wasModified) {
            return {
              fixedCode: fixedCode,
              suggestions: parsed.suggestions || [
                {
                  title: "AI-generated improvements applied",
                  description:
                    "The code has been enhanced with SEO and accessibility improvements",
                  priority: "high",
                },
              ],
              wasModified: true,
            };
          } else {
            console.log(
              "⚠️ AI returned identical code - applying fallback improvements"
            );
            return this.generateFallbackImprovedCode(
              originalCode,
              codeType,
              parsed.suggestions || []
            );
          }
        }
      }

      // Step 4: Try alternative extraction methods
      console.log("⚠️ JSON extraction failed, trying alternative methods");

      // Look for code blocks
      const codeBlockPatterns = [
        new RegExp(
          `\`\`\`(?:${codeType}|html|css|javascript|js|jsx)\s*([\\s\\S]*?)\`\`\``,
          "i"
        ),
        /```\s*([\s\S]*?)```/,
      ];

      for (const pattern of codeBlockPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const extractedCode = match[1].trim();
          if (this.isSignificantlyDifferent(extractedCode, originalCode)) {
            console.log("✅ Extracted improved code from markdown block");
            return {
              fixedCode: extractedCode,
              suggestions: [
                {
                  title: "Code extracted from AI response",
                  description:
                    "AI provided improved code with SEO enhancements",
                  priority: "medium",
                },
              ],
              wasModified: true,
            };
          }
        }
      }

      // Step 5: Generate fallback improvements if AI failed
      console.log("❌ AI did not provide improved code, generating fallback");
      return this.generateFallbackImprovedCode(originalCode, codeType, []);
    } catch (error) {
      console.error("⚠️ Fatal error in parseComprehensiveFixResponse:", error);
      return this.generateFallbackImprovedCode(originalCode, codeType, [
        {
          title: "Parsing error",
          description: "Error parsing AI response: " + error.message,
          priority: "low",
        },
      ]);
    }
  }

  // NEW METHOD: Check if code is significantly different
  isSignificantlyDifferent(code1, code2) {
    if (!code1 || !code2) return false;

    const normalized1 = code1.replace(/\s+/g, " ").trim().toLowerCase();
    const normalized2 = code2.replace(/\s+/g, " ").trim().toLowerCase();

    if (normalized1 === normalized2) return false;

    // Check if there's at least a 10% difference in length or significant content changes
    const lengthDiff =
      Math.abs(code1.length - code2.length) /
      Math.max(code1.length, code2.length);
    const contentDiff = this.calculateContentDifference(
      normalized1,
      normalized2
    );

    return lengthDiff > 0.1 || contentDiff > 0.15;
  }

  // NEW METHOD: Calculate content difference
  calculateContentDifference(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const maxLength = Math.max(words1.length, words2.length);

    let differences = 0;
    for (let i = 0; i < maxLength; i++) {
      if (words1[i] !== words2[i]) {
        differences++;
      }
    }

    return differences / maxLength;
  }

  // NEW METHOD: Find first significant difference
  findFirstDifference(code1, code2) {
    const lines1 = code1.split("\n");
    const lines2 = code2.split("\n");

    for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
      if (lines1[i].trim() !== lines2[i].trim()) {
        return {
          line: i + 1,
          original: lines1[i].trim(),
          fixed: lines2[i].trim(),
        };
      }
    }

    return null;
  }

  // NEW METHOD: Generate fallback improved code when AI fails
  generateFallbackImprovedCode(originalCode, codeType, suggestions = []) {
    console.log("🔧 Generating fallback improvements...");

    // Apply basic improvements programmatically
    let improvedCode = originalCode;
    const appliedImprovements = [];

    if (codeType === "html" || codeType === "mixed") {
      // HTML improvements
      if (!improvedCode.includes("<!DOCTYPE html>")) {
        improvedCode = "<!DOCTYPE html>\n" + improvedCode;
        appliedImprovements.push("Added HTML5 DOCTYPE");
      }

      if (!improvedCode.includes("lang=") && improvedCode.includes("<html")) {
        improvedCode = improvedCode.replace(
          /<html([^>]*)>/i,
          '<html$1 lang="en">'
        );
        appliedImprovements.push("Added language declaration");
      }

      if (
        !improvedCode.includes('meta name="viewport"') &&
        improvedCode.includes("<head")
      ) {
        improvedCode = improvedCode.replace(
          /<head>/i,
          '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
        );
        appliedImprovements.push("Added viewport meta tag");
      }

      if (
        !improvedCode.includes("meta charset") &&
        improvedCode.includes("<head")
      ) {
        improvedCode = improvedCode.replace(
          /<head>/i,
          '<head>\n  <meta charset="UTF-8">'
        );
        appliedImprovements.push("Added charset declaration");
      }

      if (
        !improvedCode.includes('meta name="description"') &&
        improvedCode.includes("<head")
      ) {
        improvedCode = improvedCode.replace(
          /<head>/i,
          '<head>\n  <meta name="description" content="SEO-optimized page description for better search engine visibility and user engagement">'
        );
        appliedImprovements.push("Added meta description");
      }
    }

    if (
      codeType === "jsx" ||
      (codeType === "javascript" && originalCode.includes("React"))
    ) {
      // React/JSX improvements
      if (
        !improvedCode.includes("aria-label") &&
        improvedCode.includes("button")
      ) {
        improvedCode = improvedCode.replace(
          /(<button[^>]*?)(>)/gi,
          '$1 aria-label="Action button"$2'
        );
        appliedImprovements.push("Added ARIA labels to buttons");
      }

      if (!improvedCode.includes("alt=") && improvedCode.includes("<img")) {
        improvedCode = improvedCode.replace(
          /(<img[^>]*?)(\s*\/?>)/gi,
          '$1 alt="Descriptive image content"$2'
        );
        appliedImprovements.push("Added alt attributes to images");
      }
    }

    if (codeType === "css") {
      // CSS improvements
      if (!improvedCode.includes("@media")) {
        const responsiveCSS = `

/* Mobile-First Responsive Design */
@media screen and (max-width: 768px) {
  body {
    font-size: 16px;
    padding: 0 1rem;
  }
  
  img {
    max-width: 100%;
    height: auto;
  }
}`;
        improvedCode += responsiveCSS;
        appliedImprovements.push("Added mobile-first responsive design");
      }

      if (!improvedCode.includes(":focus")) {
        const focusCSS = `

/* Accessibility Focus Styles */
a:focus,
button:focus,
input:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}`;
        improvedCode += focusCSS;
        appliedImprovements.push("Added accessibility focus styles");
      }
    }

    const wasModified = improvedCode !== originalCode;

    console.log("🔧 Fallback improvements result:", {
      wasModified,
      improvementsApplied: appliedImprovements.length,
      originalLength: originalCode.length,
      improvedLength: improvedCode.length,
    });

    return {
      fixedCode: wasModified ? improvedCode : originalCode,
      suggestions: [
        ...appliedImprovements.map((improvement) => ({
          title: "Automatic improvement",
          description: improvement,
          priority: "medium",
        })),
        ...suggestions,
        {
          title: wasModified
            ? "Basic improvements applied"
            : "Manual review needed",
          description: wasModified
            ? "Applied basic SEO improvements automatically"
            : "The code appears to be well-optimized already. Consider manual review for advanced optimizations.",
          priority: "low",
        },
      ],
      wasModified: wasModified,
    };
  }

  parseGeminiResponse(text) {
    try {
      // Remove markdown code blocks if present
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Ensure required fields exist
        return {
          overallScore: parsed.overallScore || 75,
          issues: parsed.issues || [],
          strengths: parsed.strengths || [],
          summary: parsed.summary || "Analysis completed",
        };
      }

      // Fallback to manual parsing if JSON is malformed
      return this.manualParseResponse(text);
    } catch (error) {
      console.warn("⚠️ Failed to parse Gemini JSON response, using fallback");

      // Fallback parsing for non-JSON responses
      return {
        overallScore: 70,
        issues: [
          {
            title: "SEO Analysis Completed",
            description:
              "AI analysis was performed but response format needs improvement",
            severity: "medium",
            recommendation:
              "Review the generated suggestions and apply manually",
          },
        ],
        strengths: [],
        summary: text.substring(0, 200) + "...",
      };
    }
  }

  parseFixSuggestions(text) {
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.suggestions || [];
      }
      return [];
    } catch (error) {
      console.warn("⚠️ Failed to parse fix suggestions");
      return [];
    }
  }

  parseRecommendations(text) {
    try {
      const cleanText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.recommendations || [];
      }
      return [];
    } catch (error) {
      console.warn("⚠️ Failed to parse recommendations");
      return [];
    }
  }

  manualParseResponse(response) {
    // Fallback manual parsing logic
    return {
      overallScore: 75,
      issues: [],
      strengths: [],
      summary: response.substring(0, 200) + "...",
    };
  }
}

module.exports = new GeminiService();
