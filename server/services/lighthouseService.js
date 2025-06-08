let lighthouse, chromeLauncher;

try {
  lighthouse = require("lighthouse");
  chromeLauncher = require("chrome-launcher");
  console.log("✅ Lighthouse modules loaded successfully");
} catch (error) {
  console.error("❌ Failed to load Lighthouse modules:", error.message);
  lighthouse = null;
  chromeLauncher = null;
}

const fs = require("fs").promises;
const path = require("path");

class LighthouseService {
  constructor() {
    this.isAvailable = !!(lighthouse && chromeLauncher);

    this.defaultConfig = {
      extends: "lighthouse:default",
      settings: {
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        emulatedFormFactor: "desktop",
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        formFactor: "desktop",
      },
    };
  }

  checkAvailability() {
    if (!this.isAvailable) {
      throw new Error(
        "Lighthouse is not available. Please install: npm install lighthouse chrome-launcher"
      );
    }
  }

  async launchChrome() {
    this.checkAvailability();

    try {
      // Windows-specific Chrome launcher options
      const chrome = await chromeLauncher.launch({
        chromeFlags: [
          "--headless",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-web-security",
          "--disable-features=TranslateUI",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-extensions",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-background-networking",
        ],
        logLevel: "error",
        port: 0, // Use random port
      });

      return chrome;
    } catch (error) {
      console.error("Failed to launch Chrome:", error);
      throw new Error(
        "Could not launch Chrome. Make sure Chrome is installed."
      );
    }
  }

  async analyzePage(url, options = {}) {
    this.checkAvailability();

    let chrome;

    try {
      console.log(`🔍 Starting Lighthouse analysis for: ${url}`);

      // Validate URL
      if (!this.isValidUrl(url)) {
        throw new Error("Invalid URL provided");
      }

      // Launch Chrome
      chrome = await this.launchChrome();
      console.log(`🚀 Chrome launched on port ${chrome.port}`);

      // Merge config with options
      const config = {
        ...this.defaultConfig,
        ...options.config,
      };

      // Run Lighthouse with error handling
      const lighthouseOptions = {
        port: chrome.port,
        disableStorageReset: false,
        ...options,
      };

      console.log("Running Lighthouse with options:", lighthouseOptions);

      let runnerResult;

      // Handle different Lighthouse import patterns
      if (typeof lighthouse === "function") {
        console.log("Using lighthouse function directly");
        runnerResult = await lighthouse(url, lighthouseOptions, config);
      } else if (
        lighthouse &&
        lighthouse.default &&
        typeof lighthouse.default === "function"
      ) {
        console.log("Using lighthouse.default function");
        runnerResult = await lighthouse.default(url, lighthouseOptions, config);
      } else if (
        lighthouse &&
        lighthouse.lighthouse &&
        typeof lighthouse.lighthouse === "function"
      ) {
        console.log("Using lighthouse.lighthouse function");
        runnerResult = await lighthouse.lighthouse(
          url,
          lighthouseOptions,
          config
        );
      } else {
        console.log("Lighthouse module structure:", Object.keys(lighthouse));
        throw new Error("Unable to find Lighthouse function in module exports");
      }

      console.log("Lighthouse runner result type:", typeof runnerResult);
      console.log("Has lhr:", !!runnerResult?.lhr);
      console.log("LHR type:", typeof runnerResult?.lhr);

      if (!runnerResult) {
        throw new Error("Lighthouse analysis failed - no results returned");
      }

      if (!runnerResult.lhr) {
        console.log(
          "No LHR in result, checking result structure:",
          Object.keys(runnerResult)
        );
        throw new Error(
          "Lighthouse analysis failed - no LHR (Lighthouse Report) in results"
        );
      }

      console.log("✅ Lighthouse analysis completed");

      // Process and return results
      return this.processLighthouseResults(runnerResult.lhr);
    } catch (error) {
      console.error("Lighthouse analysis error:", error);

      // Provide more specific error messages
      if (error.message.includes("lighthouse is not a function")) {
        throw new Error(
          "Lighthouse module import error. Try reinstalling: npm install lighthouse@10.4.0"
        );
      } else if (error.message.includes("ECONNREFUSED")) {
        throw new Error(
          "Failed to connect to website. Please check the URL is accessible."
        );
      } else if (error.message.includes("Chrome")) {
        throw new Error(
          "Chrome browser error. Please ensure Chrome is installed and accessible."
        );
      } else {
        throw new Error(`Lighthouse analysis failed: ${error.message}`);
      }
    } finally {
      // Always kill Chrome instance with Windows-specific handling
      if (chrome) {
        try {
          await chrome.kill();
          console.log("🔴 Chrome instance closed");

          // Add small delay for Windows file system
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (killError) {
          // Windows often has file locking issues - this is normal
          if (
            killError.code === "EBUSY" ||
            killError.message.includes("resource busy")
          ) {
            console.log(
              "⚠️ Chrome cleanup delayed (Windows file locking - normal)"
            );
          } else {
            console.error("Error closing Chrome:", killError);
          }
        }
      }
    }
  }

  processLighthouseResults(lhr) {
    console.log("Processing Lighthouse results...", {
      hasCategories: !!lhr.categories,
      hasAudits: !!lhr.audits,
      url: lhr.finalUrl,
    });

    const categories = lhr.categories || {};
    const audits = lhr.audits || {};

    // Debug log the categories
    console.log("Categories found:", Object.keys(categories));
    console.log("Raw Performance score:", categories.performance?.score);
    console.log("Raw SEO score:", categories.seo?.score);

    // Extract key metrics with proper 0-100 conversion
    const metrics = {
      performance: {
        score: categories.performance?.score
          ? Math.round(categories.performance.score * 100)
          : 0,
        metrics: {
          firstContentfulPaint:
            audits["first-contentful-paint"]?.displayValue || "N/A",
          largestContentfulPaint:
            audits["largest-contentful-paint"]?.displayValue || "N/A",
          cumulativeLayoutShift:
            audits["cumulative-layout-shift"]?.displayValue || "N/A",
          totalBlockingTime:
            audits["total-blocking-time"]?.displayValue || "N/A",
          speedIndex: audits["speed-index"]?.displayValue || "N/A",
        },
      },
      seo: {
        score: categories.seo?.score
          ? Math.round(categories.seo.score * 100)
          : 0,
        issues: this.extractSEOIssues(audits),
      },
      accessibility: {
        score: categories.accessibility?.score
          ? Math.round(categories.accessibility.score * 100)
          : 0,
        issues: this.extractAccessibilityIssues(audits),
      },
      bestPractices: {
        score: categories["best-practices"]?.score
          ? Math.round(categories["best-practices"].score * 100)
          : 0,
        issues: this.extractBestPracticesIssues(audits),
      },
    };

    // Calculate overall score
    const scores = [
      metrics.performance.score,
      metrics.seo.score,
      metrics.accessibility.score,
      metrics.bestPractices.score,
    ].filter((score) => score > 0); // Only include valid scores

    const overallScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

    const result = {
      url: lhr.finalUrl || lhr.requestedUrl,
      timestamp: new Date().toISOString(),
      overallScore,
      categories: metrics,
      opportunities: this.extractOpportunities(audits),
      diagnostics: this.extractDiagnostics(audits),
      runtimeError: lhr.runtimeError,
      // Add raw data for debugging
      debug: {
        categoriesCount: Object.keys(categories).length,
        auditsCount: Object.keys(audits).length,
        rawScores: {
          performance: categories.performance?.score,
          seo: categories.seo?.score,
          accessibility: categories.accessibility?.score,
          bestPractices: categories["best-practices"]?.score,
        },
        convertedScores: {
          performance: metrics.performance.score,
          seo: metrics.seo.score,
          accessibility: metrics.accessibility.score,
          bestPractices: metrics.bestPractices.score,
        },
      },
    };

    console.log("Processed result with corrected scores:", {
      overallScore: result.overallScore,
      scores: {
        performance: result.categories.performance.score,
        seo: result.categories.seo.score,
        accessibility: result.categories.accessibility.score,
        bestPractices: result.categories.bestPractices.score,
      },
    });

    return result;
  }

  extractSEOIssues(audits) {
    const seoAudits = [
      "document-title",
      "meta-description",
      "http-status-code",
      "link-text",
      "crawlable-anchors",
      "is-crawlable",
      "robots-txt",
      "image-alt",
      "hreflang",
      "canonical",
    ];

    return seoAudits
      .filter((auditId) => audits[auditId] && audits[auditId].score !== 1)
      .map((auditId) => ({
        id: auditId,
        title: audits[auditId].title,
        description: audits[auditId].description,
        score: audits[auditId].score,
        displayValue: audits[auditId].displayValue,
      }));
  }

  extractAccessibilityIssues(audits) {
    const a11yAudits = Object.keys(audits).filter(
      (id) =>
        audits[id].scoreDisplayMode === "binary" &&
        audits[id].score !== 1 &&
        (id.includes("aria-") ||
          id.includes("color-") ||
          id.includes("focus-") ||
          [
            "image-alt",
            "label",
            "link-name",
            "button-name",
            "form-field-multiple-labels",
          ].includes(id))
    );

    return a11yAudits.map((auditId) => ({
      id: auditId,
      title: audits[auditId].title,
      description: audits[auditId].description,
      impact: audits[auditId].details?.impact || "unknown",
    }));
  }

  extractBestPracticesIssues(audits) {
    const bpAudits = [
      "is-on-https",
      "uses-http2",
      "no-vulnerable-libraries",
      "external-anchors-use-rel-noopener",
      "geolocation-on-start",
      "notification-on-start",
    ];

    return bpAudits
      .filter((auditId) => audits[auditId] && audits[auditId].score !== 1)
      .map((auditId) => ({
        id: auditId,
        title: audits[auditId].title,
        description: audits[auditId].description,
        score: audits[auditId].score,
      }));
  }

  extractOpportunities(audits) {
    const opportunityAudits = Object.keys(audits).filter(
      (id) =>
        audits[id].details?.type === "opportunity" &&
        audits[id].details?.overallSavingsMs > 0
    );

    return opportunityAudits.map((auditId) => ({
      id: auditId,
      title: audits[auditId].title,
      description: audits[auditId].description,
      savings: audits[auditId].details.overallSavingsMs,
      displayValue: audits[auditId].displayValue,
    }));
  }

  extractDiagnostics(audits) {
    const diagnosticAudits = Object.keys(audits).filter(
      (id) => audits[id].details?.type === "table" && audits[id].score !== 1
    );

    return diagnosticAudits.slice(0, 10).map((auditId) => ({
      id: auditId,
      title: audits[auditId].title,
      description: audits[auditId].description,
      displayValue: audits[auditId].displayValue,
    }));
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }

  async analyzeLocalHTML(htmlContent, baseUrl = "http://localhost:3000") {
    // For local HTML analysis, we'd need to serve it temporarily
    // This is a simplified version - you might want to use a temporary server
    throw new Error(
      "Local HTML analysis not yet implemented. Please provide a live URL."
    );
  }

  // Fallback method when Lighthouse is not available
  getMockResults(url) {
    return {
      url: url,
      timestamp: new Date().toISOString(),
      overallScore: 75,
      categories: {
        performance: {
          score: 80,
          metrics: {
            firstContentfulPaint: "N/A - Lighthouse unavailable",
            largestContentfulPaint: "N/A - Lighthouse unavailable",
            cumulativeLayoutShift: "N/A - Lighthouse unavailable",
            totalBlockingTime: "N/A - Lighthouse unavailable",
            speedIndex: "N/A - Lighthouse unavailable",
          },
        },
        seo: {
          score: 75,
          issues: [
            {
              id: "lighthouse-unavailable",
              title: "Lighthouse Analysis Unavailable",
              description:
                "Lighthouse could not be loaded. Please install with: npm install lighthouse chrome-launcher",
              score: 0,
            },
          ],
        },
        accessibility: {
          score: 70,
          issues: [],
        },
        bestPractices: {
          score: 75,
          issues: [],
        },
      },
      opportunities: [],
      diagnostics: [],
      error: "Lighthouse modules not available",
    };
  }
}

module.exports = new LighthouseService();
