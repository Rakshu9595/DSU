
/**
 * recommendation.service.js
 *
 * AI-powered energy-saving recommendations
 * for the DSU Energy Management and
 * Sustainability System.
 *
 * Responsibilities:
 * 1. Validate project and appliance data.
 * 2. Build energy recommendation prompts.
 * 3. Call the configured Gemini LLM service.
 * 4. Check the generated response.
 * 5. Apply basic hallucination checks.
 * 6. Return recommendations or a safe fallback.
 */

const {
  buildRecommendationsPrompt
} = require("../prompts/recommendations.prompt");

const {
  getSystemPrompt
} = require("../prompts/system.prompt");

const {
  generateText
} = require("./llm.service");

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
 * Generate energy-saving recommendations.
 *
 * The caller must verify the user's access
 * to the project and appliance information.
 *
 * @param {Object} params
 * @param {Object} params.projectContext
 * @param {Object} params.deviceContext
 * @param {Object} params.energyContext
 * @param {Object} params.ratingContext
 * @param {Object} params.scenarioContext
 * @param {string} params.question
 *
 * @returns {Promise<Object>}
 */
async function generateRecommendations({
  projectContext = {},
  deviceContext = {},
  energyContext = {},
  ratingContext = {},
  scenarioContext = {},
  question = ""
} = {}) {

  // STEP 1: Validate context objects
  const contexts = {
    projectContext,
    deviceContext,
    energyContext,
    ratingContext,
    scenarioContext
  };

  for (const [name, value] of Object.entries(contexts)) {
    if (!isValidObject(value)) {
      throw new Error(
        `${name} must be a valid object.`
      );
    }
  }

  // STEP 2: Validate question
  if (
    typeof question !== "string" ||
    question.length > 2000
  ) {
    throw new Error(
      "Question must be a string of at most 2000 characters."
    );
  }

  // STEP 3: Check required project information
  if (Object.keys(projectContext).length === 0) {
    return handleMissingData({
      service: "recommendation"
    });
  }

  // STEP 4: Check available appliance information
  if (Object.keys(deviceContext).length === 0) {
    return handleMissingData({
      service: "recommendation"
    });
  }

  // STEP 5: Prepare global AI instructions
  const systemPrompt = getSystemPrompt();

  // STEP 6: Prepare recommendation instructions
  const prompt = buildRecommendationsPrompt({
    projectContext,
    deviceContext,
    energyContext,
    ratingContext,
    scenarioContext,
    question: question.trim()
  });

  // STEP 7: Generate recommendations
  try {
    const result = await generateText({
      systemPrompt,
      prompt
    });

    // STEP 8: Extract generated text
    const recommendations =
      typeof result === "string"
        ? result
        : result?.text;

    if (
      typeof recommendations !== "string" ||
      recommendations.trim().length === 0
    ) {
      const error = new Error(
        "AI returned an empty recommendation."
      );

      error.code = "EMPTY_RESPONSE";
      throw error;
    }

    // STEP 9: Check for potentially
    // unsupported numerical claims
    const guarded = guardAIResponse({
      response: recommendations,
      trustedContext: {
        projectContext,
        deviceContext,
        energyContext,
        ratingContext,
        scenarioContext
      },
      strictMode: true
    });

    if (!guarded.approved) {
      const error = new Error(
        "AI recommendations require verification."
      );

      error.code = "INVALID_RESPONSE";
      throw error;
    }

    // STEP 10: Return recommendations
    return {
      success: true,
      recommendations: guarded.answer,
      source: "ai",
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    // Return a safe, structured fallback
    return handleAIFailure(error, {
      service: "recommendation"
    });
  }
}

module.exports = {
  generateRecommendations
};
