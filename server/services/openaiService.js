const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  async analyzeCodeForSEO(
    code,
    codeType,
    framework = null,
    automatedAnalysis = {}
  ) {
    try {
      const prompt = this.createSEOAnalysisPrompt(
        code,
        codeType,
        framework,
        automatedAnalysis
      );

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const systemPrompt =
        "You are an expert frontend SEO consultant with deep knowledge of HTML, CSS, JavaScript, and modern frameworks. Provide detailed, actionable SEO analysis and recommendations.";

      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text);
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error("Failed to get AI analysis");
    }
  }

  async generateFixSuggestions(code, codeType, issues) {
    try {
      const prompt = this.createFixSuggestionsPrompt(code, codeType, issues);

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const systemPrompt =
        "You are a senior frontend developer specializing in SEO optimization. Provide specific code fixes and improvements.";

      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return this.parseFixSuggestions(text);
    } catch (error) {
      console.error("Gemini fix suggestions error:", error);
      throw new Error("Failed to generate fix suggestions");
    }
  }

  async getRecommendations(code, codeType, framework, currentIssues) {
    try {
      const prompt = this.createRecommendationsPrompt(
        code,
        codeType,
        framework,
        currentIssues
      );

      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const systemPrompt =
        "You are an SEO strategist focused on technical implementation. Provide prioritized, actionable recommendations.";

      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return this.parseRecommendations(text);
    } catch (error) {
      console.error("Gemini recommendations error:", error);
      throw new Error("Failed to get recommendations");
    }
  }

  createSEOAnalysisPrompt(code, codeType, framework, automatedAnalysis) {
    return `
Analyze this ${codeType} code for SEO optimization:

${framework ? `Framework: ${framework}` : ""}

Code:
\`\`\`${codeType}
${code}
\`\`\`

Automated Analysis Results:
${JSON.stringify(automatedAnalysis, null, 2)}

Please provide a detailed SEO analysis in the following JSON format:
{
  "overallScore": 85,
  "criticalIssues": [
    "Missing meta description",
    "No structured data"
  ],
  "improvements": [
    {
      "issue": "Missing meta description",
      "impact": "high",
      "explanation": "Meta descriptions improve click-through rates from search results",
      "solution": "Add a compelling meta description between 150-160 characters",
      "codeExample": "<meta name=\"description\" content=\"Your optimized description here\">"
    }
  ],
  "bestPractices": [
    "Use semantic HTML5 elements",
    "Implement proper heading hierarchy"
  ],
  "frameworkSpecific": [
    "Consider using React Helmet for meta management"
  ]
}

Focus on:
1. Technical SEO issues
2. Content structure problems
3. Performance implications
4. Framework-specific optimizations
5. Accessibility improvements that impact SEO
`;
  }

  createFixSuggestionsPrompt(code, codeType, issues) {
    return `
Provide specific code fixes for these SEO issues in ${codeType}:

Original Code:
\`\`\`${codeType}
${code}
\`\`\`

Issues to Fix:
${JSON.stringify(issues, null, 2)}

Please provide fixes in this JSON format:
{
  "fixes": [
    {
      "issue": "Issue name",
      "originalCode": "problematic code snippet",
      "fixedCode": "corrected code snippet",
      "explanation": "why this fix improves SEO"
    }
  ],
  "manualRecommendations": [
    "Things that need manual attention"
  ]
}

Provide working, copy-paste ready code fixes.
`;
  }

  createRecommendationsPrompt(code, codeType, framework, currentIssues) {
    return `
Based on this ${codeType} code analysis, provide prioritized SEO recommendations:

${framework ? `Framework: ${framework}` : ""}

Current Issues Found:
${JSON.stringify(currentIssues, null, 2)}

Code Context:
\`\`\`${codeType}
${code.substring(0, 1000)}...
\`\`\`

Provide recommendations in this JSON format:
{
  "immediate": [
    {
      "action": "Fix critical meta tags",
      "priority": "high",
      "effort": "low",
      "impact": "high"
    }
  ],
  "shortTerm": [
    {
      "action": "Implement structured data",
      "priority": "medium",
      "effort": "medium",
      "impact": "high"
    }
  ],
  "longTerm": [
    {
      "action": "Optimize for Core Web Vitals",
      "priority": "medium",
      "effort": "high",
      "impact": "high"
    }
  ]
}

Focus on actionable, prioritized recommendations.
`;
  }

  parseAIResponse(response) {
    try {
      // Clean up the response - remove markdown formatting if present
      let cleanResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");

      // Try to extract JSON from the response
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback to manual parsing if JSON is malformed
      return this.manualParseResponse(response);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return {
        overallScore: 75,
        criticalIssues: ["Unable to parse AI response"],
        improvements: [],
        bestPractices: [],
        error: "Response parsing failed",
      };
    }
  }

  parseFixSuggestions(response) {
    try {
      // Clean up the response - remove markdown formatting if present
      let cleanResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");

      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { fixes: [], manualRecommendations: [] };
    } catch (error) {
      console.error("Failed to parse fix suggestions:", error);
      return { fixes: [], manualRecommendations: [], error: "Parsing failed" };
    }
  }

  parseRecommendations(response) {
    try {
      // Clean up the response - remove markdown formatting if present
      let cleanResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");

      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { immediate: [], shortTerm: [], longTerm: [] };
    } catch (error) {
      console.error("Failed to parse recommendations:", error);
      return {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        error: "Parsing failed",
      };
    }
  }

  manualParseResponse(response) {
    // Fallback manual parsing logic
    return {
      overallScore: 75,
      criticalIssues: [],
      improvements: [],
      bestPractices: [],
      rawResponse: response,
    };
  }
}

module.exports = new GeminiService();
