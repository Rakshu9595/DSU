const {
  buildScenarioAnalysisPrompt
} = require("../prompts/scenario-analysis.prompt");

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
 * Create a coded error for the fallback service.
 */
function createServiceError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Generate an AI explanation comparing
 * energy consumption scenarios.
 *
 * @param {Object} params
 * @param {Object} params.projectContext
 * @param {Object} params.scenarioContext
 * @param {Object} params.energyContext
 * @param {Object} params.deviceContext
 * @param {string} params.question
 *
 * @returns {Promise<Object>}
 */
async function generateScenarioExplanation({
  projectContext = {},
  scenarioContext = {},
  energyContext = {},
  deviceContext = {},
  question = ""
} = {}) {

  // STEP 1: Validate all context objects
  const contexts = {
    projectContext,
    scenarioContext,
    energyContext,
    deviceContext
  };

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

  // STEP 3: Check required scenario data
  if (Object.keys(scenarioContext).length === 0) {
    return handleMissingData({
      service: "scenario-explanation"
    });
  }

  // STEP 4: Build the global system prompt
  const systemPrompt = getSystemPrompt();

  // STEP 5: Build the scenario-specific prompt
  const prompt = buildScenarioAnalysisPrompt({
    projectContext,
    scenarioContext,
    energyContext,
    deviceContext,
    question: question.trim()
  });

  try {

    // STEP 6: Generate explanation with Gemini
    const aiResult = await generateText({
      systemPrompt,
      prompt
    });

    // STEP 7: Parse the AI response
    const parsed = parseAIResponse({
      response: aiResult,
      type: "text"
    });

    const explanation = parsed.data;

    // STEP 8: Run basic hallucination checks
    const guarded = guardAIResponse({
      response: explanation,
      trustedContext: {
        projectContext,
        scenarioContext,
        energyContext,
        deviceContext
      },
      strictMode: true
    });

    if (!guarded.approved) {
      throw createServiceError(
        "Scenario explanation requires verification.",
        "INVALID_RESPONSE"
      );
    }

    // STEP 9: Return the result
    return {
      success: true,
      scenarioId:
        scenarioContext.scenarioId ??
        scenarioContext.id ??
        null,
      explanation: guarded.answer,
      source: "ai",
      validation: {
        status: guarded.validation.status,
        warningCount: guarded.validation.warningCount
      },
      generatedAt: new Date().toISOString()
    };

  } catch (error) {

    // STEP 10: Return a safe fallback
    return handleAIFailure(error, {
      service: "scenario-explanation"
    });
  }
}

module.exports = {
  generateScenarioExplanation
};
