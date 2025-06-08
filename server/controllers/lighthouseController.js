const express = require("express");
const router = express.Router();
const lighthouseService = require("../services/lighthouseService");

// Analyze URL with Lighthouse
router.post("/analyze", async (req, res) => {
  try {
    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        error: "URL is required",
        example: "https://example.com",
      });
    }

    console.log(`📊 Lighthouse analysis requested for: ${url}`);

    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      return res.status(400).json({
        error: "Invalid URL format",
        provided: url,
        example: "https://example.com",
      });
    }

    // Set timeout for the request (5 minutes max)
    const timeout = setTimeout(() => {
      res.status(408).json({
        error: "Lighthouse analysis timed out",
        message:
          "The analysis took too long. This might happen with very slow websites.",
      });
    }, 5 * 60 * 1000); // 5 minutes

    try {
      const results = await lighthouseService.analyzePage(url, options);
      clearTimeout(timeout);

      console.log(`✅ Lighthouse analysis completed for: ${url}`);
      res.json({
        success: true,
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (analysisError) {
      clearTimeout(timeout);
      console.error(`❌ Lighthouse analysis failed for ${url}:`, analysisError);

      res.status(500).json({
        error: "Lighthouse analysis failed",
        message: analysisError.message,
        url: url,
        suggestions: [
          "Make sure the URL is accessible",
          "Check if the website is online",
          "Ensure Chrome is installed on the server",
          "Try with a different URL",
        ],
      });
    }
  } catch (error) {
    console.error("Lighthouse controller error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get Lighthouse status/health check
router.get("/status", async (req, res) => {
  try {
    // Test if Chrome can be launched
    const chromeLauncher = require("chrome-launcher");

    let chrome;
    try {
      chrome = await chromeLauncher.launch({
        chromeFlags: ["--headless", "--no-sandbox"],
        logLevel: "error",
      });

      await chrome.kill();

      res.json({
        status: "ready",
        message: "Lighthouse service is ready",
        chrome: "available",
        timestamp: new Date().toISOString(),
      });
    } catch (chromeError) {
      res.status(503).json({
        status: "unavailable",
        message: "Chrome launcher failed",
        error: chromeError.message,
        suggestions: [
          "Install Google Chrome",
          "Check Chrome installation path",
          "Ensure Chrome can run in headless mode",
        ],
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Lighthouse status check failed",
      error: error.message,
    });
  }
});

// Get sample analysis for demo purposes
router.get("/demo", (req, res) => {
  res.json({
    url: "https://example.com",
    overallScore: 85,
    categories: {
      performance: {
        score: 90,
        metrics: {
          firstContentfulPaint: "1.2s",
          largestContentfulPaint: "2.1s",
          cumulativeLayoutShift: "0.05",
          totalBlockingTime: "150ms",
          speedIndex: "1.8s",
        },
      },
      seo: {
        score: 92,
        issues: [
          {
            id: "meta-description",
            title: "Document does not have a meta description",
            description:
              "Meta descriptions help search engines understand your page content",
          },
        ],
      },
      accessibility: {
        score: 88,
        issues: [],
      },
      bestPractices: {
        score: 80,
        issues: [
          {
            id: "is-on-https",
            title: "Uses HTTPS",
            description: "All sites should be protected with HTTPS",
          },
        ],
      },
    },
    opportunities: [
      {
        id: "unused-css-rules",
        title: "Remove unused CSS",
        savings: 500,
        displayValue: "Potential savings of 500ms",
      },
    ],
    diagnostics: [
      {
        id: "dom-size",
        title: "Avoid an excessive DOM size",
        displayValue: "1,500 elements",
      },
    ],
    timestamp: new Date().toISOString(),
    demo: true,
  });
});

module.exports = router;
