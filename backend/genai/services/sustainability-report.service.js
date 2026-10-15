const {
  buildSustainabilityReportPrompt
} = require("../prompts/sustainability-report.prompt");

const {
  getSystemPrompt
} = require("../prompts/system.prompt");

const {
  generateText
} = require("./llm.service");

const {
  parseAIResponse
} = require("./response-parser.service");

const {
  guardAIResponse
} = require("./hallucination-guard.service");

const {
  handleAIFailure,
  handleMissingData
} = require("./fallback.service");

/**
 * Check whether a value is a plain object.
 */
function isValidObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Create an error with a stable code.
 */
function createServiceError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Validate sustainability report input.
 */
function validateReportInput({
  projectContext,
  deviceContext,
  energyContext,
  ratingContext,
  scenarioContext,
  recommendations,
  evidenceContext,
  question
}) {

  const contexts = {
    projectContext,
    deviceContext,
    energyContext,
    ratingContext,
    scenarioContext,
    evidenceContext
  };

  // Validate all context objects
  for (const [name, value] of Object.entries(contexts)) {
    if (!isValidObject(value)) {
      throw new Error(
        `${name} must be a valid object.`
      );
    }
  }

  // Validate recommendations
  if (!Array.isArray(recommendations)) {
    throw new Error(
      "Recommendations must be an array."
    );
  }

  // Validate optional report question
  if (
    typeof question !== "string" ||
    question.length > 2000
  ) {
    throw new Error(
      "Question must be a string of at most 2000 characters."
    );
  }

  return true;
}

/**
 * Generate a sustainability report.
 *
 * The caller must verify the user's access
 * to all supplied project information.
 *
 * @param {Object} params
 * @param {Object} params.projectContext
 * @param {Object} params.deviceContext
 * @param {Object} params.energyContext
 * @param {Object} params.ratingContext
 * @param {Object} params.scenarioContext
 * @param {Array} params.recommendations
 * @param {Object} params.evidenceContext
 * @param {string} params.question
 *
 * @returns {Promise<Object>}
 */
async function generateSustainabilityReport({
  projectContext = {},
  deviceContext = {},
  energyContext = {},
  ratingContext = {},
  scenarioContext = {},
  recommendations = [],
  evidenceContext = {},
  question = ""
} = {}) {

  // STEP 1: Validate input
  validateReportInput({
    projectContext,
    deviceContext,
    energyContext,
    ratingContext,
    scenarioContext,
    recommendations,
    evidenceContext,
    question
  });

  // STEP 2: Require project information
  if (Object.keys(projectContext).length === 0) {
    return handleMissingData({
      service: "sustainability-report"
    });
  }

  // STEP 3: Require energy or device data
  if (
    Object.keys(deviceContext).length === 0 &&
    Object.keys(energyContext).length === 0
  ) {
    return handleMissingData({
      service: "sustainability-report"
    });
  }

  try {

    // STEP 4: Load global AI instructions
    const systemPrompt = getSystemPrompt();

    // STEP 5: Build report-specific prompt
    const prompt = buildSustainabilityReportPrompt({
      projectContext,
      deviceContext,
      energyContext,
      ratingContext,
      scenarioContext,
      recommendations,
      evidenceContext,
      question: question.trim()
    });

    // STEP 6: Generate report using Gemini
    const aiResult = await generateText({
      systemPrompt,
      prompt
    });

    // STEP 7: Parse the generated report
    const parsed = parseAIResponse({
      response: aiResult,
      type: "text"
    });

    const reportText = parsed.data;

    // STEP 8: Check for potentially
    // unsupported numerical claims
    const guarded = guardAIResponse({
      response: reportText,
      trustedContext: {
        projectContext,
        deviceContext,
        energyContext,
        ratingContext,
        scenarioContext,
        recommendations,
        evidenceContext
      },
      strictMode: true
    });

    if (!guarded.approved) {
      throw createServiceError(
        "Sustainability report requires verification.",
        "INVALID_RESPONSE"
      );
    }

    // STEP 9: Return structured report
    return {
      success: true,
      report: {
        title: "Energy Sustainability Report",
        projectId:
          projectContext.projectId ??
          projectContext.id ??
          null,
        projectName:
          projectContext.projectName ??
          projectContext.name ??
          null,
        content: guarded.answer,
        format: "text"
      },
      source: "ai",
      validation: {
        status: guarded.validation.status,
        warningCount: guarded.validation.warningCount
      },
      generatedAt: new Date().toISOString()
    };

  } catch (error) {

    // STEP 10: Return safe fallback
    return handleAIFailure(error, {
      service: "sustainability-report"
    });
  }
}

module.exports = {
  validateReportInput,
  generateSustainabilityReport
};
