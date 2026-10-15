const {
  buildDeviceExplanationPrompt
} = require("../prompts/device-explanation.prompt");

const {
  getSystemPrompt
} = require("../prompts/system.prompt");

const {
  generateText
} = require("./llm.service");

/**
 * Check whether a value is a plain data object.
 */
function isValidObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Generate an AI explanation for an appliance.
 *
 * IMPORTANT:
 * The caller must verify that the user is
 * authorized to access the supplied device
 * and project information.
 *
 * @param {Object} params
 * @param {Object} params.deviceContext
 * @param {Object} params.energyContext
 * @param {Object} params.ratingContext
 * @param {Object} params.projectContext
 * @param {string} params.question
 *
 * @returns {Promise<Object>}
 */
async function generateDeviceInsight({
  deviceContext,
  energyContext = {},
  ratingContext = {},
  projectContext = {},
  question = ""
} = {}) {

  // STEP 1: Validate required device context
  if (
    !isValidObject(deviceContext) ||
    Object.keys(deviceContext).length === 0
  ) {
    throw new Error(
      "Valid device context is required."
    );
  }

  // STEP 2: Validate optional contexts
  const contexts = {
    energyContext,
    ratingContext,
    projectContext
  };

  for (const [name, value] of Object.entries(contexts)) {
    if (!isValidObject(value)) {
      throw new Error(
        `${name} must be a valid object.`
      );
    }
  }

  // STEP 3: Validate the optional question
  if (
    typeof question !== "string" ||
    question.length > 2000
  ) {
    throw new Error(
      "Question must be a string of at most 2000 characters."
    );
  }

  // STEP 4: Prepare the system prompt
  const systemPrompt = getSystemPrompt();

  // STEP 5: Prepare the device explanation prompt
  const prompt = buildDeviceExplanationPrompt({
    deviceContext,
    energyContext,
    ratingContext,
    projectContext,
    question: question.trim()
  });

  // STEP 6: Generate the AI explanation
  try {
    const result = await generateText({
      systemPrompt,
      prompt
    });

    // STEP 7: Extract the generated text
    const explanation =
      typeof result === "string"
        ? result
        : result?.text;

    // STEP 8: Validate basic response format
    if (
      typeof explanation !== "string" ||
      explanation.trim().length === 0
    ) {
      throw new Error(
        "AI returned an empty or invalid explanation."
      );
    }

    // STEP 9: Prepare structured response
    return {
      success: true,
      deviceId: deviceContext.id ??
        deviceContext.deviceId ??
        null,
      deviceName: deviceContext.name ?? null,
      explanation: explanation.trim(),
      source: "ai",
      generatedAt: new Date().toISOString()
    };

  } catch (error) {

    // Avoid exposing provider errors to the user
    console.error(
      "Device insight generation failed:",
      error?.name || "UnknownError"
    );

    throw new Error(
      "Unable to generate device insight right now."
    );
  }
}

module.exports = {
  generateDeviceInsight
};
