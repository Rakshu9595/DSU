
const {
  buildWasteAnalysisPrompt
} = require("../prompts/waste-analysis.prompt");

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
 * Check whether a value is a valid object.
 */
function isValidObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Create a service error with a stable code.
 */
function createServiceError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Validate the waste analysis input.
 *
 * @param {Object} params
 * @returns {boolean}
 */
function validateWasteAnalysisInput({
  projectContext,
  deviceContext,
  energyContext,
  ratingContext,
  scenarioContext,
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

  // STEP 1: Validate context objects
  for (const [name, value] of Object.entries(contexts)) {
    if (!isValidObject(value)) {
      throw new Error(
        `${name} must be a valid object.`
      );
    }
  }

  // STEP 2: Validate the question
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
 * Generate an AI-powered energy waste analysis.
 *
 * The caller must verify that the user has
 * permission to access the supplied data.
 *
 * @param {Object} params
 * @param {Object} params.projectContext
 * @param {Object} params.deviceContext
 * @param {Object} params.energyContext
 * @param {Object} params.ratingContext
 * @param {Object} params.scenarioContext
 * @param {Object} params.evidenceContext
 * @param {string} params.question
 *
 * @returns {Promise<Object>}
 */
async function generateWasteAnalysis({
  projectContext = {},
  deviceContext = {},
  energyContext = {},
  ratingContext = {},
  scenarioContext = {},
  evidenceContext = {},
  question = ""
} = {}) {

  // STEP 1: Validate all inputs
  validateWasteAnalysisInput({
    projectContext,
    deviceContext,
    energyContext,
    ratingContext,
    scenarioContext,
    evidenceContext,
    question
  });

  // STEP 2: Check required data
  if (
    Object.keys(deviceContext).length === 0 &&
    Object.keys(energyContext).length === 0
  ) {
    return handleMissingData({
      service: "waste-analysis"
    });
  }

  try {

    // STEP 3: Load global AI instructions
    const systemPrompt = getSystemPrompt();

    // STEP 4: Build waste analysis prompt
    const prompt = buildWasteAnalysisPrompt({
      projectContext,
      deviceContext,
      energyContext,
      ratingContext,
      scenarioContext,
      evidenceContext,
      question: question.trim()
    });

    // STEP 5: Generate AI response
    const aiResult = await generateText({
      systemPrompt,
      prompt
    });

    // STEP 6: Parse the response
    const parsed = parseAIResponse({
      response: aiResult,
      type: "text"
    });

    const analysisText = parsed.data;

    // STEP 7: Check for potentially
    // unsupported numerical claims
    const guarded = guardAIResponse({
      response: analysisText,
      trustedContext: {
        projectContext,
        deviceContext,
        energyContext,
        ratingContext,
        scenarioContext,
        evidenceContext
      },
      strictMode: true
    });

    if (!guarded.approved) {
      throw createServiceError(
        "Waste analysis requires verification.",
        "INVALID_RESPONSE"
      );
    }

    // STEP 8: Return structured result
    return {
      success: true,

      analysis: {
        title: "Energy Waste Analysis",

        projectId:
          projectContext.projectId ??
          projectContext.id ??
          null,

        deviceId:
          deviceContext.deviceId ??
          deviceContext.id ??
          null,

        deviceName:
          deviceContext.name ??
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

    // STEP 9: Return a safe fallback
    return handleAIFailure(error, {
      service: "waste-analysis"
    });
  }
}

// Export the service functions
module.exports = {
  validateWasteAnalysisInput,
  generateWasteAnalysis
};
