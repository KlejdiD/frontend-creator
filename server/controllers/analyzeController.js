const express = require("express");
const router = express.Router();
const geminiService = require("../services/geminiService");
const codeAnalyzer = require("../services/codeAnalyzer");
const autoFixer = require("../services/autoFixer");

// Analyze code endpoint
router.post("/", async (req, res) => {
  try {
    console.log("📊 Code analysis request received");
    const { code, codeType, framework } = req.body;

    if (!code || !codeType) {
      console.log("❌ Missing required fields");
      return res.status(400).json({
        error: "Code and codeType are required",
      });
    }

    console.log(`🔍 Analyzing ${codeType} code (${code.length} characters)`);

    // Step 1: Run automated analysis (if service exists)
    let automatedAnalysis = { score: 75, issues: [] };
    try {
      automatedAnalysis = await codeAnalyzer.analyzeCode(
        code,
        codeType,
        framework
      );
      console.log("✅ Automated analysis completed");
    } catch (error) {
      console.log(
        "⚠️ Automated analysis service not available, using defaults"
      );
    }

    // Step 2: Get AI-powered insights using Gemini
    console.log("🤖 Starting Gemini AI analysis...");
    const aiAnalysis = await geminiService.analyzeCodeForSEO(
      code,
      codeType,
      framework,
      automatedAnalysis
    );

    // Step 3: Combine results
    const combinedAnalysis = {
      overallScore: aiAnalysis.overallScore || automatedAnalysis.score || 75,
      issues: aiAnalysis.issues || [],
      strengths: aiAnalysis.strengths || [],
      summary: aiAnalysis.summary || "Analysis completed",
      automated: automatedAnalysis,
      ai: aiAnalysis,
      timestamp: new Date().toISOString(),
    };

    console.log("✅ Analysis completed successfully:", {
      overallScore: combinedAnalysis.overallScore,
      issuesFound: combinedAnalysis.issues.length,
    });

    res.json(combinedAnalysis);
  } catch (error) {
    console.error("❌ Analysis error:", error);
    res.status(500).json({
      error: "Failed to analyze code",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// FIXED: Auto-fix code endpoint with proper diagnostic placement
router.post("/fix", async (req, res) => {
  try {
    console.log("🔧 Fix request received");
    const { code, codeType, issues, framework } = req.body;

    if (!code || !codeType) {
      return res.status(400).json({
        error: "Code and codeType are required",
      });
    }

    console.log(
      `🔧 Fixing ${codeType} code with ${issues?.length || 0} issues`
    );

    // Step 1: Apply automated fixes first
    let fixedCode = code;
    let appliedFixes = [];

    try {
      const autoFixResult = await autoFixer.applyFixes(
        code,
        codeType,
        issues || []
      );
      fixedCode = autoFixResult.code || code;
      appliedFixes = autoFixResult.appliedFixes || [];
      console.log(`✅ Automated fixes applied: ${appliedFixes.length}`);
    } catch (error) {
      console.log("⚠️ Auto-fixer service failed:", error.message);
    }

    // Step 2: Get AI-powered comprehensive fixes using Gemini
    console.log("🤖 Getting AI fix suggestions from Gemini...");
    let finalFixedCode = fixedCode;
    let aiSuggestions = [];

    try {
      // Generate comprehensive fixed code using Gemini
      const aiFixResult = await geminiService.generateComprehensiveCodeFix(
        code,
        codeType,
        framework,
        issues || []
      );

      // DIAGNOSTIC CODE PLACED CORRECTLY HERE
      console.log("🚨 DIAGNOSTIC - Raw aiFixResult:");
      console.log("Type:", typeof aiFixResult);
      console.log("Keys:", Object.keys(aiFixResult));
      console.log("aiFixResult.fixedCode type:", typeof aiFixResult.fixedCode);
      console.log(
        "aiFixResult.fixedCode keys:",
        aiFixResult.fixedCode ? Object.keys(aiFixResult.fixedCode) : "null"
      );
      console.log(
        "aiFixResult.fixedCode.code exists:",
        !!aiFixResult.fixedCode?.code
      );
      console.log(
        "aiFixResult.fixedCode.code type:",
        typeof aiFixResult.fixedCode?.code
      );
      console.log(
        "aiFixResult.fixedCode.code preview:",
        aiFixResult.fixedCode?.code?.substring(0, 100)
      );

      // AGGRESSIVE EXTRACTION - Try every possible way to get the string
      let extractedCode = code; // fallback to original

      if (typeof aiFixResult.fixedCode === "string") {
        extractedCode = aiFixResult.fixedCode;
        console.log("✅ Using direct string fixedCode");
      } else if (
        aiFixResult.fixedCode?.code &&
        typeof aiFixResult.fixedCode.code === "string"
      ) {
        extractedCode = aiFixResult.fixedCode.code;
        console.log("✅ Extracted from nested fixedCode.code");
      } else if (
        aiFixResult.fixedCode?.fixedCode &&
        typeof aiFixResult.fixedCode.fixedCode === "string"
      ) {
        extractedCode = aiFixResult.fixedCode.fixedCode;
        console.log("✅ Extracted from double-nested fixedCode.fixedCode");
      } else if (typeof aiFixResult.code === "string") {
        extractedCode = aiFixResult.code;
        console.log("✅ Extracted from top-level code property");
      } else if (
        aiFixResult.fixedCode &&
        typeof aiFixResult.fixedCode === "object"
      ) {
        // Try to find ANY string property that looks like code
        for (const [key, value] of Object.entries(aiFixResult.fixedCode)) {
          if (typeof value === "string" && value.length > 50) {
            extractedCode = value;
            console.log(`✅ Extracted from property: ${key}`);
            break;
          }
        }
      }

      console.log("🔍 Extraction result:", {
        type: typeof extractedCode,
        length: extractedCode.length,
        isIdentical: extractedCode === code,
        preview: extractedCode.substring(0, 100),
      });

      // Final validation
      if (extractedCode && extractedCode.trim().length > 0) {
        finalFixedCode = extractedCode;
        if (extractedCode !== code) {
          console.log("✅ AI generated improved code");
        } else {
          console.log(
            "⚠️ AI returned identical code - improvements may be in suggestions only"
          );
        }
      } else {
        console.log("⚠️ Could not extract valid code, using original");
        finalFixedCode = code;
      }

      aiSuggestions = aiFixResult.suggestions || [];
    } catch (error) {
      console.log("⚠️ AI fix generation failed:", error.message);
    }

    // Step 3: FORCE the response to be a string (Nuclear Option)
    let finalCodeString = finalFixedCode;

    // Ensure it's definitely a string
    if (typeof finalCodeString !== "string") {
      console.log("🚨 finalFixedCode is not a string, forcing conversion...");
      finalCodeString = String(finalCodeString);
    }

    const wasModified = finalCodeString !== code;
    const originalLength = code.length;
    const fixedLength = finalCodeString.length;

    // GUARANTEE that fixedCode is a string in the response
    const response = {
      fixedCode: finalCodeString, // ALWAYS a string
      code: finalCodeString, // ALWAYS a string
      appliedFixes,
      aiSuggestions,
      improvements: [
        ...appliedFixes,
        ...aiSuggestions
          .map((s) => s.description || s.explanation || s.title)
          .filter(Boolean),
      ],
      metadata: {
        originalLength,
        fixedLength,
        wasModified,
        modificationType: wasModified ? "ai-enhanced" : "no-changes",
        timestamp: new Date().toISOString(),
      },
      message: wasModified
        ? `Code was successfully improved with ${appliedFixes.length} automated fixes and AI enhancements`
        : "No improvements were generated. The code may already be well-optimized.",
    };

    // FINAL DEBUG: Log the response structure
    console.log("🔍 FINAL RESPONSE CHECK:", {
      hasFixedCode: !!response.fixedCode,
      fixedCodeType: typeof response.fixedCode,
      fixedCodeIsString: typeof response.fixedCode === "string",
      fixedCodeLength:
        typeof response.fixedCode === "string"
          ? response.fixedCode.length
          : "not string",
      wasModified: wasModified,
      responseKeys: Object.keys(response),
    });

    console.log("✅ Fix completed:", {
      wasModified,
      appliedFixes: appliedFixes.length,
      aiSuggestions: aiSuggestions.length,
    });

    res.json(response);
  } catch (error) {
    console.error("❌ Fix error:", error);
    res.status(500).json({
      error: "Failed to fix code",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Get SEO recommendations
router.post("/recommendations", async (req, res) => {
  try {
    console.log("💡 Recommendations request received");
    const { code, codeType, framework, currentIssues } = req.body;

    const recommendations = await geminiService.getRecommendations(
      code,
      codeType,
      framework,
      currentIssues
    );

    res.json({
      recommendations,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Recommendations error:", error);
    res.status(500).json({
      error: "Failed to get recommendations",
      message: error.message,
    });
  }
});

module.exports = router;
