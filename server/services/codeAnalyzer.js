const { JSDOM } = require("jsdom");

class CodeAnalyzer {
  async analyzeCode(code, codeType, framework) {
    switch (codeType.toLowerCase()) {
      case "html":
        return this.analyzeHTML(code);
      case "css":
        return this.analyzeCSS(code);
      case "javascript":
      case "js":
        return this.analyzeJavaScript(code, framework);
      default:
        throw new Error(`Unsupported code type: ${codeType}`);
    }
  }

  analyzeHTML(htmlCode) {
    try {
      const dom = new JSDOM(htmlCode);
      const document = dom.window.document;

      const analysis = {
        score: 0,
        metaTags: this.checkMetaTags(document),
        headingStructure: this.analyzeHeadings(document),
        semanticHTML: this.checkSemanticElements(document),
        images: this.analyzeImages(document),
        links: this.analyzeLinks(document),
        accessibility: this.checkAccessibility(document),
        performance: this.checkPerformanceHints(document),
      };

      // Calculate overall score
      analysis.score = this.calculateHTMLScore(analysis);

      return analysis;
    } catch (error) {
      console.error("HTML analysis error:", error);
      return { error: "Failed to analyze HTML", score: 0 };
    }
  }

  checkMetaTags(document) {
    const issues = [];
    const suggestions = [];

    // Check for title tag
    const title = document.querySelector("title");
    if (!title) {
      issues.push("Missing title tag");
    } else if (title.textContent.length < 30 || title.textContent.length > 60) {
      issues.push("Title length should be 30-60 characters");
    }

    // Check for meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      issues.push("Missing meta description");
    } else if (
      metaDescription.getAttribute("content").length < 120 ||
      metaDescription.getAttribute("content").length > 160
    ) {
      issues.push("Meta description should be 120-160 characters");
    }

    // Check for viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      issues.push("Missing viewport meta tag");
    }

    // Check for Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (!ogTitle || !ogDescription) {
      suggestions.push("Add Open Graph meta tags for social sharing");
    }

    return { issues, suggestions };
  }

  analyzeHeadings(document) {
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    const issues = [];
    const suggestions = [];

    const h1s = document.querySelectorAll("h1");
    if (h1s.length === 0) {
      issues.push("Missing H1 tag");
    } else if (h1s.length > 1) {
      issues.push("Multiple H1 tags found - should have only one");
    }

    // Check heading hierarchy
    let lastLevel = 0;
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastLevel + 1) {
        issues.push(
          `Heading hierarchy skip detected: ${heading.tagName} after H${lastLevel}`
        );
      }
      lastLevel = level;
    });

    return {
      issues,
      suggestions,
      headingCount: headings.length,
      hierarchy: Array.from(headings).map((h) => h.tagName),
    };
  }

  checkSemanticElements(document) {
    const semanticElements = [
      "header",
      "nav",
      "main",
      "article",
      "section",
      "aside",
      "footer",
    ];
    const found = [];
    const missing = [];

    semanticElements.forEach((element) => {
      if (document.querySelector(element)) {
        found.push(element);
      } else {
        missing.push(element);
      }
    });

    const suggestions = [];
    if (missing.includes("main")) {
      suggestions.push("Add <main> element to identify primary content");
    }
    if (missing.includes("header")) {
      suggestions.push("Consider adding <header> element");
    }

    return { found, missing, suggestions };
  }

  analyzeImages(document) {
    const images = document.querySelectorAll("img");
    const issues = [];
    const suggestions = [];

    let missingAlt = 0;
    let emptyAlt = 0;

    images.forEach((img) => {
      const alt = img.getAttribute("alt");
      if (!alt) {
        missingAlt++;
      } else if (alt.trim() === "") {
        emptyAlt++;
      }
    });

    if (missingAlt > 0) {
      issues.push(`${missingAlt} images missing alt attributes`);
    }
    if (emptyAlt > 0) {
      suggestions.push(`${emptyAlt} images have empty alt attributes`);
    }

    // Check for lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if (images.length > 3 && lazyImages.length === 0) {
      suggestions.push("Consider adding lazy loading to images");
    }

    return {
      issues,
      suggestions,
      totalImages: images.length,
      missingAlt,
      emptyAlt,
    };
  }

  analyzeLinks(document) {
    const links = document.querySelectorAll("a");
    const issues = [];
    const suggestions = [];

    let externalWithoutNofollow = 0;
    let missingTitle = 0;

    links.forEach((link) => {
      const href = link.getAttribute("href");
      const title = link.getAttribute("title");
      const rel = link.getAttribute("rel");

      // Check external links
      if (
        href &&
        href.startsWith("http") &&
        !href.includes(window?.location?.hostname || "")
      ) {
        if (!rel || !rel.includes("nofollow")) {
          externalWithoutNofollow++;
        }
      }

      // Check for descriptive link text
      if (
        link.textContent.trim().toLowerCase().includes("click here") ||
        link.textContent.trim().toLowerCase().includes("read more")
      ) {
        suggestions.push(
          'Use descriptive link text instead of "click here" or "read more"'
        );
      }
    });

    if (externalWithoutNofollow > 0) {
      suggestions.push(
        `Consider adding rel="nofollow" to ${externalWithoutNofollow} external links`
      );
    }

    return {
      issues,
      suggestions,
      totalLinks: links.length,
      externalWithoutNofollow,
    };
  }

  checkAccessibility(document) {
    const issues = [];
    const suggestions = [];

    // Check for lang attribute
    const html = document.querySelector("html");
    if (!html || !html.getAttribute("lang")) {
      issues.push("Missing lang attribute on <html> element");
    }

    // Check for skip navigation
    const skipLink = document.querySelector(
      'a[href="#main"], a[href="#content"]'
    );
    if (!skipLink) {
      suggestions.push("Consider adding skip navigation link");
    }

    return { issues, suggestions };
  }

  checkPerformanceHints(document) {
    const suggestions = [];

    // Check for critical CSS
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    if (stylesheets.length > 3) {
      suggestions.push(
        "Consider inlining critical CSS and lazy loading non-critical styles"
      );
    }

    // Check for preload hints
    const preloads = document.querySelectorAll('link[rel="preload"]');
    if (preloads.length === 0 && stylesheets.length > 0) {
      suggestions.push("Consider preloading critical resources");
    }

    return { suggestions };
  }

  analyzeCSS(cssCode) {
    const issues = [];
    const suggestions = [];

    // Basic CSS analysis
    const hasMediaQueries = cssCode.includes("@media");
    if (!hasMediaQueries) {
      issues.push("No responsive design detected - missing media queries");
    }

    // Check for performance issues
    const hasImportant = (cssCode.match(/!important/g) || []).length;
    if (hasImportant > 5) {
      suggestions.push(
        `Reduce usage of !important (found ${hasImportant} instances)`
      );
    }

    return {
      score: hasMediaQueries ? 75 : 50,
      issues,
      suggestions,
      hasMediaQueries,
      importantCount: hasImportant,
    };
  }

  analyzeJavaScript(jsCode, framework) {
    const issues = [];
    const suggestions = [];

    // Framework-specific analysis
    if (framework) {
      switch (framework.toLowerCase()) {
        case "react":
          return this.analyzeReactCode(jsCode);
        case "vue":
          return this.analyzeVueCode(jsCode);
        default:
          break;
      }
    }

    // General JavaScript SEO analysis
    const hasDocumentReady =
      jsCode.includes("DOMContentLoaded") ||
      jsCode.includes("$(document).ready");

    if (!hasDocumentReady && jsCode.includes("document.")) {
      suggestions.push(
        "Consider wrapping DOM manipulation in DOMContentLoaded event"
      );
    }

    // Check for SEO-unfriendly patterns
    if (jsCode.includes("document.write")) {
      issues.push("document.write() can harm SEO and performance");
    }

    // Check for proper script loading
    if (
      jsCode.includes("document.getElementById") ||
      jsCode.includes("document.querySelector")
    ) {
      if (!hasDocumentReady) {
        issues.push("DOM manipulation without waiting for document ready");
      }
    }

    // Check for AJAX/fetch patterns that might affect SEO
    const hasAsyncContent =
      jsCode.includes("fetch(") ||
      jsCode.includes("XMLHttpRequest") ||
      jsCode.includes("axios.") ||
      jsCode.includes("$.ajax");

    if (hasAsyncContent) {
      suggestions.push(
        "Ensure dynamic content is properly rendered for crawlers (consider SSR)"
      );
    }

    // Check for history API usage
    const hasHistoryAPI =
      jsCode.includes("pushState") ||
      jsCode.includes("replaceState") ||
      jsCode.includes("history.back");

    if (hasHistoryAPI) {
      suggestions.push(
        "Ensure proper URL handling and meta tag updates for SPA navigation"
      );
    }

    // Check for lazy loading implementations
    const hasLazyLoading =
      jsCode.includes("IntersectionObserver") ||
      jsCode.includes('loading="lazy"') ||
      jsCode.includes("data-src");

    if (hasLazyLoading) {
      // Bonus for implementing lazy loading
    } else if (jsCode.includes("img") || jsCode.includes("Image")) {
      suggestions.push("Consider implementing lazy loading for images");
    }

    return {
      score: this.calculateJSScore(
        issues,
        suggestions,
        hasDocumentReady,
        hasAsyncContent
      ),
      issues,
      suggestions,
      framework: framework || "vanilla",
      hasDocumentReady,
      hasAsyncContent,
      hasHistoryAPI,
      hasLazyLoading,
    };
  }

  analyzeReactCode(jsCode) {
    const issues = [];
    const suggestions = [];

    // Check for React Helmet usage
    const hasHelmet =
      jsCode.includes("react-helmet") ||
      jsCode.includes("Helmet") ||
      jsCode.includes("@helmet");
    if (!hasHelmet) {
      suggestions.push("Consider using React Helmet for meta tag management");
    }

    // Check for SSR patterns
    const hasSSR =
      jsCode.includes("getServerSideProps") ||
      jsCode.includes("getStaticProps") ||
      jsCode.includes("renderToString") ||
      jsCode.includes("getInitialProps");
    if (!hasSSR) {
      suggestions.push(
        "Consider Server-Side Rendering (Next.js) for better SEO"
      );
    }

    // Check for Next.js specific features
    const hasNextJS =
      jsCode.includes("next/") ||
      jsCode.includes("useRouter") ||
      jsCode.includes("Link from") ||
      jsCode.includes("next/image");

    if (hasNextJS) {
      // Check for proper Next.js Image usage
      if (jsCode.includes("<img") && !jsCode.includes("next/image")) {
        suggestions.push("Use Next.js Image component for better performance");
      }

      // Check for Next.js Head usage
      if (!jsCode.includes("next/head") && !hasHelmet) {
        suggestions.push("Use Next.js Head component for meta tag management");
      }
    }

    // Check for React Router and SEO considerations
    const hasRouter =
      jsCode.includes("react-router") ||
      jsCode.includes("BrowserRouter") ||
      jsCode.includes("useHistory");

    if (hasRouter && !hasSSR) {
      suggestions.push(
        "Consider implementing SSR or static generation for React Router apps"
      );
    }

    // Check for proper error boundaries
    const hasErrorBoundary =
      jsCode.includes("componentDidCatch") ||
      jsCode.includes("ErrorBoundary") ||
      jsCode.includes("getDerivedStateFromError");

    if (!hasErrorBoundary) {
      suggestions.push(
        "Implement Error Boundaries to prevent SEO issues from JavaScript errors"
      );
    }

    // Check for accessibility patterns
    const hasA11yPatterns =
      jsCode.includes("aria-") ||
      jsCode.includes("role=") ||
      jsCode.includes("tabIndex");

    if (!hasA11yPatterns) {
      suggestions.push(
        "Add accessibility attributes (ARIA) to improve SEO and usability"
      );
    }

    return {
      score: this.calculateReactScore(
        hasHelmet,
        hasSSR,
        hasNextJS,
        hasErrorBoundary
      ),
      issues,
      suggestions,
      framework: "react",
      hasHelmet,
      hasSSR,
      hasNextJS,
      hasRouter,
      hasErrorBoundary,
      hasA11yPatterns,
    };
  }

  analyzeVueCode(jsCode) {
    const issues = [];
    const suggestions = [];

    // Check for Vue Meta usage
    const hasVueMeta =
      jsCode.includes("vue-meta") ||
      jsCode.includes("metaInfo") ||
      jsCode.includes("$meta");
    if (!hasVueMeta) {
      suggestions.push("Consider using Vue Meta for SEO meta management");
    }

    // Check for Nuxt patterns
    const hasNuxt =
      jsCode.includes("nuxt") ||
      jsCode.includes("asyncData") ||
      jsCode.includes("$nuxt") ||
      jsCode.includes("nuxtServerInit");

    if (!hasNuxt) {
      suggestions.push("Consider using Nuxt.js for better SEO support");
    }

    // Check for Vue Router
    const hasVueRouter =
      jsCode.includes("vue-router") ||
      jsCode.includes("$router") ||
      jsCode.includes("$route");

    if (hasVueRouter && !hasNuxt) {
      suggestions.push("Consider SSR with Nuxt.js for Vue Router applications");
    }

    // Check for proper lifecycle hooks for SEO
    const hasProperLifecycle =
      jsCode.includes("created()") ||
      jsCode.includes("mounted()") ||
      jsCode.includes("beforeMount");

    if (!hasProperLifecycle && jsCode.includes("data()")) {
      suggestions.push(
        "Use proper Vue lifecycle hooks for SEO-critical operations"
      );
    }

    // Check for Vuex and data fetching patterns
    const hasVuex =
      jsCode.includes("vuex") ||
      jsCode.includes("$store") ||
      jsCode.includes("mapState");

    if (hasVuex && !hasNuxt) {
      suggestions.push("Consider Nuxt.js for better SSR support with Vuex");
    }

    // Check for Vue 3 Composition API
    const hasCompositionAPI =
      jsCode.includes("setup()") ||
      jsCode.includes("ref(") ||
      jsCode.includes("reactive(") ||
      jsCode.includes("computed(");

    if (hasCompositionAPI) {
      // Bonus for modern Vue patterns
    }

    return {
      score: this.calculateVueScore(
        hasVueMeta,
        hasNuxt,
        hasVueRouter,
        hasCompositionAPI
      ),
      issues,
      suggestions,
      framework: "vue",
      hasVueMeta,
      hasNuxt,
      hasVueRouter,
      hasVuex,
      hasCompositionAPI,
    };
  }

  analyzeAngularCode(jsCode) {
    const issues = [];
    const suggestions = [];

    // Check for Angular Universal (SSR)
    const hasUniversal =
      jsCode.includes("angular/platform-server") ||
      jsCode.includes("renderModule") ||
      jsCode.includes("@nguniversal");

    if (!hasUniversal) {
      suggestions.push("Consider Angular Universal for Server-Side Rendering");
    }

    // Check for Angular Meta service
    const hasMetaService =
      jsCode.includes("Meta") ||
      jsCode.includes("Title") ||
      jsCode.includes("@angular/platform-browser");

    if (!hasMetaService) {
      suggestions.push(
        "Use Angular Meta and Title services for SEO optimization"
      );
    }

    // Check for proper Angular routing
    const hasRouter =
      jsCode.includes("@angular/router") ||
      jsCode.includes("RouterModule") ||
      jsCode.includes("ActivatedRoute");

    if (hasRouter && !hasUniversal) {
      suggestions.push("Implement Angular Universal for SPA routing SEO");
    }

    // Check for lazy loading
    const hasLazyLoading =
      jsCode.includes("loadChildren") || jsCode.includes("import(");

    if (hasLazyLoading) {
      // Bonus for implementing lazy loading
    }

    return {
      score: this.calculateAngularScore(
        hasUniversal,
        hasMetaService,
        hasRouter
      ),
      issues,
      suggestions,
      framework: "angular",
      hasUniversal,
      hasMetaService,
      hasRouter,
      hasLazyLoading,
    };
  }

  calculateHTMLScore(analysis) {
    let score = 100;

    // Deduct points for critical issues
    score -= analysis.metaTags.issues.length * 10;
    score -= analysis.headingStructure.issues.length * 8;
    score -= analysis.images.issues.length * 5;
    score -= analysis.accessibility.issues.length * 7;
    score -= analysis.links.issues.length * 3;

    // Bonus for semantic elements (max 10 points)
    const semanticBonus = Math.min(analysis.semanticHTML.found.length * 2, 10);
    score += semanticBonus;

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  calculateJSScore(issues, suggestions, hasDocumentReady, hasAsyncContent) {
    let score = 80; // Base score for JavaScript

    // Deduct for issues
    score -= issues.length * 10;

    // Deduct for too many suggestions (indicates poor practices)
    score -= Math.max(0, (suggestions.length - 2) * 5);

    // Bonus for good practices
    if (hasDocumentReady) score += 5;
    if (!hasAsyncContent) score += 5; // Bonus for not relying heavily on client-side rendering

    return Math.max(0, Math.min(100, score));
  }

  calculateReactScore(hasHelmet, hasSSR, hasNextJS, hasErrorBoundary) {
    let score = 70; // Base score for React

    if (hasHelmet || hasNextJS) score += 10; // Meta management
    if (hasSSR) score += 15; // Server-side rendering
    if (hasNextJS) score += 10; // Next.js framework bonus
    if (hasErrorBoundary) score += 5; // Error handling

    return Math.max(0, Math.min(100, score));
  }

  calculateVueScore(hasVueMeta, hasNuxt, hasVueRouter, hasCompositionAPI) {
    let score = 70; // Base score for Vue

    if (hasVueMeta) score += 10; // Meta management
    if (hasNuxt) score += 15; // Nuxt.js framework bonus
    if (hasVueRouter && hasNuxt) score += 5; // Proper routing with SSR
    if (hasCompositionAPI) score += 5; // Modern Vue patterns

    return Math.max(0, Math.min(100, score));
  }

  calculateAngularScore(hasUniversal, hasMetaService, hasRouter) {
    let score = 70; // Base score for Angular

    if (hasMetaService) score += 10; // Meta management
    if (hasUniversal) score += 15; // Server-side rendering
    if (hasRouter && hasUniversal) score += 5; // Proper routing with SSR

    return Math.max(0, Math.min(100, score));
  }

  // Helper method to detect framework from code
  detectFramework(code) {
    if (
      code.includes("react") ||
      code.includes("jsx") ||
      code.includes("useState")
    ) {
      return "react";
    }
    if (
      code.includes("vue") ||
      code.includes("Vue.") ||
      code.includes("$emit")
    ) {
      return "vue";
    }
    if (
      code.includes("angular") ||
      code.includes("@Component") ||
      code.includes("ng-")
    ) {
      return "angular";
    }
    return "vanilla";
  }

  // Helper method to count code complexity
  calculateComplexity(code) {
    const metrics = {
      functions: (code.match(/function\s+\w+/g) || []).length,
      arrowFunctions: (code.match(/=>\s*{/g) || []).length,
      conditionals: (code.match(/if\s*\(/g) || []).length,
      loops: (code.match(/(for|while)\s*\(/g) || []).length,
      domQueries: (
        code.match(/document\.(getElementById|querySelector|getElementsBy)/g) ||
        []
      ).length,
    };

    return {
      ...metrics,
      total: Object.values(metrics).reduce((sum, count) => sum + count, 0),
    };
  }
}

module.exports = new CodeAnalyzer();
