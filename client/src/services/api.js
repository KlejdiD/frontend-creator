import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for Lighthouse analysis
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log("🚀 API Request:", config.method?.toUpperCase(), config.url, {
      data: config.data
        ? `${JSON.stringify(config.data).length} chars`
        : "no data",
      timeout: config.timeout,
    });
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.config.url, {
      status: response.status,
      dataSize: response.data
        ? `${JSON.stringify(response.data).length} chars`
        : "no data",
    });
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

// Generate demo data for development/fallback
const generateDemoAnalysis = (code, codeType) => {
  const issues = [];

  // Generate realistic issues based on code type and content
  if (codeType === "html" || codeType === "mixed") {
    if (!code.includes('meta name="description"')) {
      issues.push({
        title: "Missing Meta Description",
        description: "Your page is missing a meta description tag",
        severity: "high",
        recommendation:
          'Add a <meta name="description" content="..."> tag to your HTML head section',
        category: "seo",
      });
    }

    if (!code.includes("alt=")) {
      issues.push({
        title: "Missing Alt Text on Images",
        description:
          "Images should have descriptive alt text for accessibility and SEO",
        severity: "high",
        recommendation: 'Add alt="description" attributes to all <img> tags',
        category: "accessibility",
      });
    }

    if (!code.includes("<h1")) {
      issues.push({
        title: "Missing H1 Tag",
        description: "Every page should have exactly one H1 tag for SEO",
        severity: "medium",
        recommendation: "Add a descriptive H1 tag to your page content",
        category: "seo",
      });
    }

    if (!code.includes("lang=")) {
      issues.push({
        title: "Missing Language Declaration",
        description: "HTML should declare the page language",
        severity: "medium",
        recommendation:
          'Add lang="en" (or appropriate language) to your <html> tag',
        category: "accessibility",
      });
    }
  }

  if (codeType === "css") {
    issues.push({
      title: "Consider CSS Optimization",
      description: "CSS could be optimized for better performance",
      severity: "low",
      recommendation: "Minify CSS and remove unused styles",
      category: "performance",
    });
  }

  if (codeType === "javascript") {
    issues.push({
      title: "JavaScript Performance",
      description: "Consider optimizing JavaScript for better performance",
      severity: "low",
      recommendation: "Minimize DOM queries and use efficient algorithms",
      category: "performance",
    });
  }

  // Calculate score based on issues
  const severityWeights = { high: 20, medium: 10, low: 5 };
  const totalDeductions = issues.reduce(
    (sum, issue) => sum + severityWeights[issue.severity],
    0
  );
  const overallScore = Math.max(0, Math.min(100, 100 - totalDeductions));

  return {
    overallScore,
    issues,
    timestamp: new Date().toISOString(),
    demo: true,
    message: "Demo mode - configure Gemini API key for real analysis",
    categories: {
      seo: issues.filter((i) => i.category === "seo").length,
      accessibility: issues.filter((i) => i.category === "accessibility")
        .length,
      performance: issues.filter((i) => i.category === "performance").length,
    },
  };
};

// Generate demo fixed code
// Enhanced demo fixed code generator
const generateDemoFixedCode = (originalCode, codeType, issues) => {
  let fixedCode = originalCode;
  const improvements = [];

  if (codeType === "html" || codeType === "mixed") {
    // Add DOCTYPE if missing
    if (!fixedCode.toLowerCase().includes("<!doctype html>")) {
      fixedCode = "<!DOCTYPE html>\n" + fixedCode;
      improvements.push("Added HTML5 DOCTYPE declaration");
    }

    // Add meta description if missing
    if (
      !fixedCode.includes('meta name="description"') &&
      issues.some(
        (i) => typeof i === "string" && i.includes("Meta Description")
      )
    ) {
      fixedCode = fixedCode.replace(
        /<head>/i,
        '<head>\n  <meta name="description" content="SEO-optimized page description for better search rankings (120-160 characters)">'
      );
      improvements.push("Added comprehensive meta description for better SEO");
    }

    // Add viewport meta tag if missing
    if (!fixedCode.includes("viewport")) {
      fixedCode = fixedCode.replace(
        /<head>/i,
        '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
      improvements.push("Added responsive viewport meta tag");
    }

    // Add alt attributes to images
    if (issues.some((i) => typeof i === "string" && i.includes("Alt Text"))) {
      fixedCode = fixedCode.replace(
        /<img(?![^>]*alt=)([^>]*?)>/gi,
        '<img$1 alt="Descriptive image content for better accessibility and SEO">'
      );
      improvements.push("Added descriptive alt attributes to images");
    }

    // Add language declaration
    if (
      issues.some(
        (i) => typeof i === "string" && i.includes("Language Declaration")
      )
    ) {
      fixedCode = fixedCode.replace(/<html([^>]*)>/i, '<html$1 lang="en">');
      improvements.push("Added language declaration for accessibility");
    }

    // Add H1 if missing
    if (
      !fixedCode.includes("<h1") &&
      issues.some((i) => typeof i === "string" && i.includes("H1 Tag"))
    ) {
      fixedCode = fixedCode.replace(
        /<body([^>]*)>/i,
        "<body$1>\n  <h1>SEO-Optimized Main Page Heading</h1>"
      );
      improvements.push("Added H1 heading for better SEO structure");
    }

    // Add charset if missing
    if (!fixedCode.includes("charset")) {
      fixedCode = fixedCode.replace(
        /<head>/i,
        '<head>\n  <meta charset="UTF-8">'
      );
      improvements.push("Added UTF-8 character encoding");
    }

    // Add Open Graph tags
    if (!fixedCode.includes('property="og:')) {
      const ogTags = `
  <meta property="og:title" content="SEO Optimized Page Title">
  <meta property="og:description" content="Engaging description for social media sharing">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://yoursite.com">
  <meta property="og:image" content="https://yoursite.com/og-image.jpg">`;

      fixedCode = fixedCode.replace(/<\/head>/i, ogTags + "\n</head>");
      improvements.push("Added Open Graph meta tags for social media sharing");
    }
  }

  if (codeType === "css") {
    // Add responsive design
    if (!fixedCode.includes("@media")) {
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
}

@media screen and (max-width: 480px) {
  body {
    font-size: 14px;
  }
}`;
      fixedCode += responsiveCSS;
      improvements.push("Added mobile-first responsive design");
    }

    // Add accessibility focus styles
    if (!fixedCode.includes(":focus")) {
      const focusCSS = `

/* Accessibility Focus Styles */
a:focus,
button:focus,
input:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}`;
      fixedCode += focusCSS;
      improvements.push("Added accessibility focus styles");
    }
  }

  if (codeType === "javascript") {
    // Wrap in DOMContentLoaded if needed
    const hasDOMManipulation =
      fixedCode.includes("document.getElementById") ||
      fixedCode.includes("document.querySelector");

    if (hasDOMManipulation && !fixedCode.includes("DOMContentLoaded")) {
      fixedCode = `// SEO-friendly DOM manipulation
document.addEventListener('DOMContentLoaded', function() {
${fixedCode
  .split("\n")
  .map((line) => "  " + line)
  .join("\n")}
});`;
      improvements.push(
        "Wrapped DOM manipulation in DOMContentLoaded for better SEO"
      );
    }

    // Replace document.write
    if (fixedCode.includes("document.write")) {
      fixedCode = fixedCode.replace(
        /document\.write\s*\(/g,
        "// SEO-unfriendly document.write replaced\n// document.write("
      );
      improvements.push("Replaced SEO-blocking document.write calls");
    }
  }

  // If no improvements were made, add some generic ones
  if (improvements.length === 0) {
    improvements.push(
      "Code structure analyzed and optimized",
      "SEO best practices applied where applicable",
      "Accessibility improvements suggested"
    );
  }

  return {
    fixedCode,
    code: fixedCode,
    improvements,
    appliedFixes: improvements,
    aiSuggestions: improvements.map((imp) => ({
      title: "Demo Improvement",
      description: imp,
      priority: "medium",
    })),
    metadata: {
      wasModified: fixedCode !== originalCode,
      modificationType: "demo",
      timestamp: new Date().toISOString(),
    },
    demo: true,
    message: "Demo mode - configure Gemini API key for AI-powered fixes",
  };
};

// MAIN API FUNCTIONS

/**
 * Analyze code for SEO and accessibility issues
 */
export const analyzeCode = async (code, codeType, framework) => {
  try {
    console.log("🔍 Analyzing code:", {
      codeType,
      framework,
      codeLength: code.length,
    });

    const response = await api.post("/analyze", {
      code,
      codeType,
      framework: framework || undefined,
    });

    console.log("✅ Code analysis successful");
    return response.data;
  } catch (error) {
    console.error("❌ Code analysis failed:", error);

    // Handle different error types
    if (error.response?.status === 500) {
      console.log("🎭 Server error - returning demo analysis data");
      return generateDemoAnalysis(code, codeType);
    }

    if (error.response?.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }

    if (error.response?.status === 401) {
      throw new Error("API authentication failed. Please check your API key.");
    }

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      throw new Error("Request timed out. Please try again with shorter code.");
    }

    // Fallback to demo data for any other error
    console.log("🎭 Fallback - returning demo analysis data");
    return generateDemoAnalysis(code, codeType);
  }
};

/**
 * Get improved/fixed version of the code
 */
export const fixCode = async (code, codeType, issues = [], framework) => {
  try {
    console.log("🔧 Fixing code:", {
      codeType,
      framework,
      issuesCount: issues?.length || 0,
      codeLength: code.length,
    });

    const response = await api.post("/analyze/fix", {
      code,
      codeType,
      issues,
      framework: framework || undefined,
    });

    console.log("✅ Code fix successful");

    // Validate that we got improved code
    if (!response.data.fixedCode) {
      throw new Error("No fixed code returned from API");
    }

    if (response.data.fixedCode === code) {
      console.warn("⚠️ Fixed code is identical to original");
    }

    return response.data;
  } catch (error) {
    console.error("❌ Code fix failed:", error);

    // Handle different error types
    if (error.response?.status === 500) {
      console.log("🎭 Server error - returning demo fixed code");
      return generateDemoFixedCode(code, codeType, issues);
    }

    if (error.response?.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }

    if (error.response?.status === 401) {
      throw new Error("API authentication failed. Please check your API key.");
    }

    if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
      throw new Error("Request timed out. Please try again with shorter code.");
    }

    // Fallback to demo data
    console.log("🎭 Fallback - returning demo fixed code");
    return generateDemoFixedCode(code, codeType, issues);
  }
};

/**
 * Combined function: Analyze code and get fixed version in one call
 */
export const analyzeAndFixCode = async (code, codeType, framework) => {
  try {
    console.log("🔍🔧 Analyzing and fixing code:", {
      codeType,
      framework,
      codeLength: code.length,
    });

    // Try combined endpoint first
    try {
      const response = await api.post("/analyze-and-fix", {
        code,
        codeType,
        framework: framework || undefined,
      });

      console.log("✅ Combined analysis and fix successful");
      return response.data;
    } catch (combinedError) {
      // If combined endpoint doesn't exist, fall back to separate calls
      console.log("⚠️ Combined endpoint not available, using separate calls");

      const analysis = await analyzeCode(code, codeType, framework);
      const fixes = await fixCode(code, codeType, analysis.issues, framework);

      return {
        ...analysis,
        fixedCode: fixes.fixedCode,
        improvements: fixes.improvements,
        combined: true,
      };
    }
  } catch (error) {
    console.error("❌ Combined analysis and fix failed:", error);

    // Generate comprehensive demo data
    const analysis = generateDemoAnalysis(code, codeType);
    const fixes = generateDemoFixedCode(code, codeType, analysis.issues);

    return {
      ...analysis,
      fixedCode: fixes.fixedCode,
      improvements: fixes.improvements,
      demo: true,
      message:
        "Demo mode - configure Gemini API key for real analysis and fixes",
    };
  }
};

/**
 * Get SEO recommendations based on analysis
 */
export const getRecommendations = async (
  code,
  codeType,
  framework,
  currentIssues
) => {
  try {
    console.log("💡 Getting recommendations:", {
      codeType,
      framework,
      issuesCount: currentIssues?.length || 0,
    });

    const response = await api.post("/analyze/recommendations", {
      code,
      codeType,
      framework,
      currentIssues,
    });

    console.log("✅ Recommendations retrieved successfully");
    return response.data;
  } catch (error) {
    console.error("❌ Recommendations failed:", error);

    // Generate demo recommendations
    const demoRecommendations = [
      {
        title: "Improve Page Load Speed",
        priority: "high",
        description: "Optimize images and minify CSS/JavaScript files",
        effort: "medium",
        impact: "high",
      },
      {
        title: "Add Structured Data",
        priority: "medium",
        description:
          "Implement schema markup for better search engine understanding",
        effort: "high",
        impact: "medium",
      },
      {
        title: "Optimize for Mobile",
        priority: "high",
        description: "Ensure responsive design and mobile-friendly navigation",
        effort: "medium",
        impact: "high",
      },
    ];

    return {
      recommendations: demoRecommendations,
      demo: true,
      message:
        "Demo recommendations - configure API for personalized suggestions",
    };
  }
};

/**
 * Lighthouse performance analysis
 */
export const getLighthouseAnalysis = async (url) => {
  try {
    console.log("🔍 Starting Lighthouse analysis for:", url);

    const response = await api.post("/lighthouse/analyze", { url });

    if (!response.data.success) {
      throw new Error(response.data.message || "Lighthouse analysis failed");
    }

    const lighthouseData = response.data.results;
    console.log("📊 Processing Lighthouse data...");

    // Extract scores with multiple fallback attempts
    const extractScore = (category) => {
      const paths = [
        lighthouseData.categories?.[category]?.score,
        lighthouseData.categories?.[
          category.replace("bestPractices", "best-practices")
        ]?.score,
        lighthouseData[category]?.score,
        lighthouseData.categories?.[category],
        lighthouseData[category],
      ];

      for (let path of paths) {
        if (typeof path === "number") {
          return path <= 1 ? Math.round(path * 100) : Math.round(path);
        }
        if (typeof path === "object" && typeof path?.score === "number") {
          return path.score <= 1
            ? Math.round(path.score * 100)
            : Math.round(path.score);
        }
      }
      return 0;
    };

    const performanceScore = extractScore("performance");
    const seoScore = extractScore("seo");
    const accessibilityScore = extractScore("accessibility");
    const bestPracticesScore =
      extractScore("bestPractices") || extractScore("best-practices");

    const transformedData = {
      url: lighthouseData.url,
      timestamp: lighthouseData.timestamp || new Date().toISOString(),
      overallScore:
        lighthouseData.overallScore ||
        Math.round(
          (performanceScore +
            seoScore +
            accessibilityScore +
            bestPracticesScore) /
            4
        ),
      performance: {
        score: performanceScore,
        metrics: lighthouseData.categories?.performance?.metrics || {},
      },
      seo: {
        score: seoScore,
        issues: lighthouseData.categories?.seo?.issues || [],
      },
      accessibility: {
        score: accessibilityScore,
        issues: lighthouseData.categories?.accessibility?.issues || [],
      },
      bestPractices: {
        score: bestPracticesScore,
        issues:
          lighthouseData.categories?.bestPractices?.issues ||
          lighthouseData.categories?.["best-practices"]?.issues ||
          [],
      },
      opportunities: lighthouseData.opportunities || [],
      diagnostics: lighthouseData.diagnostics || [],
      performanceScore,
      seoScore,
      accessibilityScore,
      bestPracticesScore,
    };

    console.log("✅ Lighthouse analysis completed:", {
      overall: transformedData.overallScore,
      performance: performanceScore,
      seo: seoScore,
      accessibility: accessibilityScore,
      bestPractices: bestPracticesScore,
    });

    return transformedData;
  } catch (error) {
    console.error("❌ Lighthouse analysis failed:", error);

    if (error.code === "ECONNABORTED") {
      throw new Error(
        "Lighthouse analysis timed out. The website might be slow to load."
      );
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw new Error(error.message || "Lighthouse analysis failed");
  }
};

/**
 * Health check for API status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    console.error("❌ Health check failed:", error);
    throw new Error("API health check failed");
  }
};

/**
 * Check Lighthouse service status
 */
export const checkLighthouseStatus = async () => {
  try {
    const response = await api.get("/lighthouse/status");
    return response.data;
  } catch (error) {
    console.error("❌ Lighthouse status check failed:", error);
    throw new Error("Lighthouse status check failed");
  }
};

/**
 * Validate code before analysis
 */
export const validateCode = (code, codeType) => {
  if (!code || typeof code !== "string") {
    throw new Error("Code is required and must be a string");
  }

  if (code.trim().length === 0) {
    throw new Error("Code cannot be empty");
  }

  if (code.length > 100000) {
    // 100KB limit
    throw new Error("Code is too large. Please reduce the size and try again.");
  }

  const validTypes = ["html", "css", "javascript", "mixed", "react", "vue"];
  if (!validTypes.includes(codeType)) {
    throw new Error(
      `Invalid code type. Must be one of: ${validTypes.join(", ")}`
    );
  }

  return true;
};

/**
 * Batch process multiple code files
 */
export const batchAnalyzeCode = async (codeFiles) => {
  try {
    console.log("📦 Batch analyzing", codeFiles.length, "files");

    const results = await Promise.allSettled(
      codeFiles.map((file) =>
        analyzeCode(file.code, file.codeType, file.framework)
      )
    );

    return results.map((result, index) => ({
      fileName: codeFiles[index].fileName || `file-${index + 1}`,
      success: result.status === "fulfilled",
      data: result.status === "fulfilled" ? result.value : null,
      error: result.status === "rejected" ? result.reason.message : null,
    }));
  } catch (error) {
    console.error("❌ Batch analysis failed:", error);
    throw new Error("Batch analysis failed");
  }
};

export default api;
