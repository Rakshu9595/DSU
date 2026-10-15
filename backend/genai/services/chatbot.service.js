const {
  buildChatbotPrompt
} = require("../prompts/chatbot.prompt");

const {
  getSystemPrompt
} = require("../prompts/system.prompt");

const {
  generateText
} = require("./llm.service");

/**
 * Checks whether a value is a plain object.
 */
function isValidObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Generates an AI chatbot response.
 *
 * IMPORTANT:
 * Context must be fetched and authorized
 * by the backend before calling this service.
 *
 * @param {Object} params
 * @param {string} params.question
 * @param {Object} params.projectContext
 * @param {Object} params.deviceContext
 * @param {Object} params.energyContext
 * @param {Object} params.scenarioContext
 *
 * @returns {Promise<Object>}
 */
async function generateChatbotResponse({
  question,
  projectContext = {},
  deviceContext = {},
  energyContext = {},
  scenarioContext = {}
} = {}) {

  // STEP 1: Validate the user question
  if (
    typeof question !== "string" ||
    question.trim().length === 0
  ) {
    throw new Error(
      "A valid chatbot question is required."
    );
  }

  if (question.length > 2000) {
    throw new Error(
      "Chatbot question exceeds the maximum length."
    );
  }

  // STEP 2: Validate context objects
  const contexts = {
    projectContext,
    deviceContext,
    energyContext,
    scenarioContext
  };

  for (const [name, value] of Object.entries(contexts)) {
    if (!isValidObject(value)) {
      throw new Error(
        `${name} must be a valid object.`
      );
    }
  }

  // STEP 3: Build the system prompt
  const systemPrompt = getSystemPrompt();

  // STEP 4: Build the chatbot prompt
  const prompt = buildChatbotPrompt({
    question: question.trim(),
    projectContext,
    deviceContext,
    energyContext,
    scenarioContext
  });

  // STEP 5: Request a response from Gemini
  try {
    const result = await generateText({
      systemPrompt,
      prompt
    });

    // STEP 6: Normalize the LLM response
    // Supports a string or an object with a text field.
    const answer =
      typeof result === "string"
        ? result
        : result?.text;

    // STEP 7: Check for an empty response
    if (
      typeof answer !== "string" ||
      answer.trim().length === 0
    ) {
      throw new Error(
        "AI returned an empty or invalid response."
      );
    }

    // STEP 8: Return the chatbot result
    return {
      success: true,
      answer: answer.trim(),
      source: "ai",
      generatedAt: new Date().toISOString()
    };

  } catch (error) {

    // Avoid exposing provider errors or API secrets.
    console.error(
      "Chatbot generation failed:",
      error?.name || "UnknownError"
    );

    throw new Error(
      "Unable to generate a chatbot response right now."
    );
  }
}

// Export the chatbot service
module.exports = {
  generateChatbotResponse
};
