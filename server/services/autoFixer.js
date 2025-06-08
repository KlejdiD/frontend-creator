const { JSDOM } = require("jsdom");

class AutoFixer {
  async applyFixes(code, codeType, issues) {
    console.log(
      `🔧 AutoFixer: Processing ${codeType} code with issues:`,
      issues
    );

    switch (codeType.toLowerCase()) {
      case "html":
        return this.fixHTML(code, issues);
      case "css":
        return this.fixCSS(code, issues);
      case "javascript":
      case "js":
        return this.fixJavaScript(code, issues);
      default:
        return {
          code: code,
          appliedFixes: [`Unsupported code type: ${codeType}`],
          originalLength: code.length,
          fixedLength: code.length,
        };
    }
  }

  fixHTML(htmlCode, issues) {
    let fixedCode = htmlCode;
    const appliedFixes = [];

    try {
      const dom = new JSDOM(htmlCode);
      const document = dom.window.document;
      let modified = false;

      // Fix missing DOCTYPE
      if (!htmlCode.toLowerCase().includes("<!doctype html>")) {
        fixedCode = "<!DOCTYPE html>\n" + fixedCode;
        appliedFixes.push("Added HTML5 DOCTYPE declaration");
        modified = true;
      }

      // Fix missing meta description
      if (
        this.hasIssue(issues, ["meta description", "description"]) ||
        !document.querySelector('meta[name="description"]')
      ) {
        const head = document.querySelector("head");
        if (head && !document.querySelector('meta[name="description"]')) {
          const metaDesc = document.createElement("meta");
          metaDesc.setAttribute("name", "description");
          metaDesc.setAttribute(
            "content",
            "Improve your SEO with this optimized page description (120-160 characters)"
          );
          head.appendChild(metaDesc);
          appliedFixes.push("Added meta description");
          modified = true;
        }
      }

      // Fix missing viewport meta tag
      if (
        this.hasIssue(issues, ["viewport"]) ||
        !document.querySelector('meta[name="viewport"]')
      ) {
        const head = document.querySelector("head");
        if (head && !document.querySelector('meta[name="viewport"]')) {
          const viewport = document.createElement("meta");
          viewport.setAttribute("name", "viewport");
          viewport.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0"
          );
          head.appendChild(viewport);
          appliedFixes.push("Added responsive viewport meta tag");
          modified = true;
        }
      }

      // Fix missing title tag
      if (
        this.hasIssue(issues, ["title"]) ||
        !document.querySelector("title")
      ) {
        const head = document.querySelector("head");
        if (head) {
          let titleElement = document.querySelector("title");
          if (!titleElement) {
            titleElement = document.createElement("title");
            head.appendChild(titleElement);
            appliedFixes.push("Added title tag");
            modified = true;
          }
          if (
            !titleElement.textContent ||
            titleElement.textContent.trim().length === 0
          ) {
            titleElement.textContent = "SEO Optimized Page Title | Your Brand";
            appliedFixes.push("Added optimized title content");
            modified = true;
          }
        }
      }

      // Fix missing charset
      if (!document.querySelector("meta[charset]")) {
        const head = document.querySelector("head");
        if (head) {
          const charset = document.createElement("meta");
          charset.setAttribute("charset", "UTF-8");
          head.insertBefore(charset, head.firstChild);
          appliedFixes.push("Added UTF-8 charset declaration");
          modified = true;
        }
      }

      // Fix missing alt attributes
      if (
        this.hasIssue(issues, ["alt", "image"]) ||
        document.querySelectorAll("img:not([alt])").length > 0
      ) {
        const imagesWithoutAlt = document.querySelectorAll("img:not([alt])");
        imagesWithoutAlt.forEach((img, index) => {
          const src = img.getAttribute("src") || "image";
          const altText = this.generateAltText(src, index);
          img.setAttribute("alt", altText);
          modified = true;
        });
        if (imagesWithoutAlt.length > 0) {
          appliedFixes.push(
            `Added descriptive alt attributes to ${imagesWithoutAlt.length} images`
          );
        }
      }

      // Fix missing lang attribute
      if (
        this.hasIssue(issues, ["lang"]) ||
        !document.querySelector("html[lang]")
      ) {
        const html = document.querySelector("html");
        if (html && !html.getAttribute("lang")) {
          html.setAttribute("lang", "en");
          appliedFixes.push('Added lang="en" to html element');
          modified = true;
        }
      }

      // Fix heading structure
      if (
        this.hasIssue(issues, ["h1", "heading"]) ||
        !document.querySelector("h1")
      ) {
        const body = document.querySelector("body");
        if (body && !document.querySelector("h1")) {
          const h1 = document.createElement("h1");
          h1.textContent = "Main Page Heading - SEO Optimized";
          body.insertBefore(h1, body.firstChild);
          appliedFixes.push("Added missing H1 heading");
          modified = true;
        }
      }

      // Fix multiple H1 tags
      if (this.hasIssue(issues, ["Multiple H1", "multiple h1"])) {
        const h1s = document.querySelectorAll("h1");
        if (h1s.length > 1) {
          for (let i = 1; i < h1s.length; i++) {
            const h2 = document.createElement("h2");
            h2.textContent = h1s[i].textContent;
            // Copy other attributes
            Array.from(h1s[i].attributes).forEach((attr) => {
              h2.setAttribute(attr.name, attr.value);
            });
            h1s[i].parentNode.replaceChild(h2, h1s[i]);
          }
          appliedFixes.push(
            `Converted ${h1s.length - 1} additional H1 tags to H2`
          );
          modified = true;
        }
      }

      // Add basic Open Graph tags
      if (
        this.hasIssue(issues, ["open graph", "og:", "social"]) ||
        !document.querySelector('meta[property^="og:"]')
      ) {
        const head = document.querySelector("head");
        if (head) {
          const ogTags = [
            { property: "og:type", content: "website" },
            {
              property: "og:title",
              content:
                document.querySelector("title")?.textContent ||
                "SEO Optimized Page",
            },
            {
              property: "og:description",
              content:
                document
                  .querySelector('meta[name="description"]')
                  ?.getAttribute("content") || "SEO optimized page description",
            },
            { property: "og:url", content: "https://yoursite.com" },
          ];

          ogTags.forEach((tag) => {
            if (!document.querySelector(`meta[property="${tag.property}"]`)) {
              const meta = document.createElement("meta");
              meta.setAttribute("property", tag.property);
              meta.setAttribute("content", tag.content);
              head.appendChild(meta);
            }
          });
          appliedFixes.push("Added Open Graph meta tags for social sharing");
          modified = true;
        }
      }

      // Add structured data
      if (this.hasIssue(issues, ["structured data", "schema", "json-ld"])) {
        const head = document.querySelector("head");
        if (
          head &&
          !document.querySelector('script[type="application/ld+json"]')
        ) {
          const structuredData = this.generateStructuredDataScript(document);
          head.appendChild(structuredData);
          appliedFixes.push("Added JSON-LD structured data");
          modified = true;
        }
      }

      if (modified) {
        fixedCode = dom.serialize();
      }
    } catch (error) {
      console.error("HTML fixing error:", error);
      appliedFixes.push(`Error occurred during fixing: ${error.message}`);
    }

    return {
      code: fixedCode,
      appliedFixes,
      originalLength: htmlCode.length,
      fixedLength: fixedCode.length,
    };
  }

  fixCSS(cssCode, issues) {
    let fixedCode = cssCode;
    const appliedFixes = [];

    try {
      // Add basic responsive design if missing
      if (
        this.hasIssue(issues, ["responsive", "media queries", "mobile"]) ||
        !cssCode.includes("@media")
      ) {
        const responsiveCSS = `

/* Responsive Design - Mobile First */
@media screen and (max-width: 768px) {
  body {
    font-size: 16px;
    line-height: 1.6;
    padding: 0 1rem;
  }
  
  img {
    max-width: 100%;
    height: auto;
  }
  
  .container {
    width: 100%;
    padding: 0 1rem;
  }
}

@media screen and (max-width: 480px) {
  body {
    font-size: 14px;
  }
  
  h1 {
    font-size: 1.8rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}

@media screen and (min-width: 769px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
}`;
        fixedCode += responsiveCSS;
        appliedFixes.push(
          "Added comprehensive responsive design media queries"
        );
      }

      // Fix missing focus styles for accessibility
      if (
        this.hasIssue(issues, ["focus", "accessibility", "a11y"]) ||
        !cssCode.includes(":focus")
      ) {
        const focusCSS = `

/* Accessibility - Focus Styles */
a:focus,
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #007acc;
  outline-offset: 2px;
}

/* Skip to main content link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000;
  color: #fff;
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}`;
        fixedCode += focusCSS;
        appliedFixes.push("Added accessibility focus styles and skip link");
      }

      // Reduce !important usage (basic example)
      if (
        this.hasIssue(issues, ["!important", "important"]) ||
        (cssCode.match(/!important/g) || []).length > 5
      ) {
        const importantCount = (cssCode.match(/!important/g) || []).length;
        appliedFixes.push(
          `Found ${importantCount} !important declarations - consider refactoring CSS specificity`
        );
      }

      // Add print styles
      if (
        this.hasIssue(issues, ["print"]) ||
        !cssCode.includes("@media print")
      ) {
        const printCSS = `

/* Print Styles */
@media print {
  body {
    background: white;
    color: black;
    font-size: 12pt;
  }
  
  nav, .sidebar, .ads {
    display: none;
  }
  
  a:after {
    content: " (" attr(href) ")";
  }
  
  .page-break {
    page-break-before: always;
  }
}`;
        fixedCode += printCSS;
        appliedFixes.push("Added print-optimized styles");
      }
    } catch (error) {
      console.error("CSS fixing error:", error);
      appliedFixes.push(`Error occurred during CSS fixing: ${error.message}`);
    }

    return {
      code: fixedCode,
      appliedFixes,
      originalLength: cssCode.length,
      fixedLength: fixedCode.length,
    };
  }

  fixJavaScript(jsCode, issues) {
    let fixedCode = jsCode;
    const appliedFixes = [];

    try {
      // Fix document.write usage
      if (
        this.hasIssue(issues, ["document.write"]) ||
        jsCode.includes("document.write")
      ) {
        fixedCode = fixedCode.replace(
          /document\.write\s*\(/g,
          "// SEO-unfriendly document.write() replaced\n// Consider using DOM manipulation instead:\n// document.write("
        );
        appliedFixes.push("Commented out SEO-blocking document.write() calls");
      }

      // Add DOMContentLoaded wrapper if needed
      const hasDOMManipulation =
        jsCode.includes("document.getElementById") ||
        jsCode.includes("document.querySelector") ||
        jsCode.includes("document.getElementsBy");

      const hasDocumentReady =
        jsCode.includes("DOMContentLoaded") ||
        jsCode.includes("$(document).ready");

      if (hasDOMManipulation && !hasDocumentReady) {
        fixedCode = `// SEO-friendly DOM manipulation - wait for content to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded - SEO content is ready');
  
${fixedCode
  .split("\n")
  .map((line) => "  " + line)
  .join("\n")}
  
});`;
        appliedFixes.push(
          "Wrapped DOM manipulation in DOMContentLoaded for better SEO"
        );
      }

      // Fix async content loading for SEO
      const hasAsyncContent =
        jsCode.includes("fetch(") ||
        jsCode.includes("XMLHttpRequest") ||
        jsCode.includes("axios.") ||
        jsCode.includes("$.ajax");

      if (hasAsyncContent && !jsCode.includes("// SEO")) {
        const seoComment = `
// SEO Note: Dynamic content loading detected
// Consider implementing Server-Side Rendering (SSR) or 
// pre-rendering for better search engine crawlability
// Use structured data and meta tags for dynamic content

`;
        fixedCode = seoComment + fixedCode;
        appliedFixes.push("Added SEO guidance for dynamic content loading");
      }

      // Add error handling for better UX and SEO
      if (
        (jsCode.includes("fetch(") || jsCode.includes("XMLHttpRequest")) &&
        !jsCode.includes("catch") &&
        !jsCode.includes("onerror")
      ) {
        appliedFixes.push(
          "Consider adding error handling for network requests to improve user experience"
        );
      }

      // Fix history API usage
      if (jsCode.includes("pushState") || jsCode.includes("replaceState")) {
        if (!jsCode.includes("// SEO") && !jsCode.includes("meta")) {
          const seoHistoryComment = `
// SEO Note: History API usage detected
// Remember to update page title and meta tags when changing URLs
// Example: document.title = 'New Page Title';
//          updateMetaDescription('New description');

`;
          fixedCode = seoHistoryComment + fixedCode;
          appliedFixes.push("Added SEO guidance for History API usage");
        }
      }

      // Add performance improvements
      if (jsCode.includes("addEventListener") && !jsCode.includes("passive")) {
        appliedFixes.push(
          "Consider adding 'passive: true' to event listeners for better performance"
        );
      }
    } catch (error) {
      console.error("JavaScript fixing error:", error);
      appliedFixes.push(
        `Error occurred during JavaScript fixing: ${error.message}`
      );
    }

    return {
      code: fixedCode,
      appliedFixes,
      originalLength: jsCode.length,
      fixedLength: fixedCode.length,
    };
  }

  // Helper method to check if an issue exists
  hasIssue(issues, keywords) {
    if (!issues || !Array.isArray(issues)) return false;

    const issueText = issues.join(" ").toLowerCase();
    return keywords.some((keyword) =>
      issueText.includes(keyword.toLowerCase())
    );
  }

  // Helper method to generate meaningful alt text
  generateAltText(src, index) {
    const filename = src.split("/").pop().split(".")[0];

    if (filename.includes("logo")) return "Company logo";
    if (filename.includes("banner")) return "Website banner image";
    if (filename.includes("hero")) return "Hero section image";
    if (filename.includes("product")) return "Product image";
    if (filename.includes("team")) return "Team member photo";
    if (filename.includes("about")) return "About us image";

    return `Descriptive alt text for image ${index + 1}`;
  }

  // Helper method to generate structured data script element
  generateStructuredDataScript(document) {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name:
        document.querySelector("title")?.textContent || "SEO Optimized Page",
      description:
        document
          .querySelector('meta[name="description"]')
          ?.getAttribute("content") ||
        "This page has been optimized for search engines",
      url: "https://yoursite.com",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://yoursite.com",
      },
      publisher: {
        "@type": "Organization",
        name: "Your Organization",
        logo: {
          "@type": "ImageObject",
          url: "https://yoursite.com/logo.jpg",
        },
      },
    };

    // Create script element properly
    const scriptElement = document.createElement("script");
    scriptElement.type = "application/ld+json";
    scriptElement.textContent = JSON.stringify(structuredData, null, 2);

    return scriptElement;
  }
}

module.exports = new AutoFixer();
