
/**
 * llm.service.js
 *
 * Central Gemini integration for the
 * DSU Energy Management and Sustainability System.
 *
 * Used by:
 * - chatbot.service.js
 * - device-insight.service.js
 * - recommendation.service.js
 * - scenario-explanation.service.js
 * - sustainability-report.service.js
 * - waste-analysis.service.js
 */

require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 30000;

let geminiClient = null;

/**
 * Create a consistent service error.
 */
function createLLMError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Initialize Gemini only when needed.
 */
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    throw createLLMError(
      "GEMINI_API_KEY is missing from environment variables.",
      "MISSING_API_KEY"
    );
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey.trim()
    });
  }

  return geminiClient;
}

/**
 * Extract text from the Gemini response.
 */
function extractGeminiText(response) {
  if (typeof response?.text === "string") {
    return response.text.trim();
  }

  const parts =
    response?.candidates?.[0]?.content?.parts;

  if (Array.isArray(parts)) {
    return parts
      .filter(
        (part) =>
          typeof part?.text === "string"
      )
      .map((part) => part.text)
      .join("")
      .trim();
  }

  return "";
}

/**
 * Generate a response using Gemini.
 *
 * This is the main function used by
 * other GenAI services.
 *
 * @param {Object} options
 * @param {string} options.systemPrompt
 * @param {string} options.prompt
 * @param {string} options.model
 * @param {number} options.temperature
 * @param {number} options.maxOutputTokens
 * @param {number} options.timeoutMs
 *
 * @returns {Promise<string>}
 */
async function generateText({
  systemPrompt = "",
  prompt,
  model = process.env.GEMINI_MODEL || DEFAULT_MODEL,
  temperature = 0.2,
  maxOutputTokens = 2048,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {

  // STEP 1: Validate input
  if (
    typeof prompt !== "string" ||
    !prompt.trim()
  ) {
    throw createLLMError(
      "A non-empty prompt is required.",
      "INVALID_PROMPT"
    );
  }

  if (typeof systemPrompt !== "string") {
    throw createLLMError(
      "systemPrompt must be a string.",
      "INVALID_SYSTEM_PROMPT"
    );
  }

  if (
    typeof model !== "string" ||
    !model.trim()
  ) {
    throw createLLMError(
      "A valid Gemini model is required.",
      "INVALID_MODEL"
    );
  }

  if (
    typeof temperature !== "number" ||
    !Number.isFinite(temperature) ||
    temperature < 0 ||
    temperature > 2
  ) {
    throw createLLMError(
      "Temperature must be between 0 and 2.",
      "INVALID_TEMPERATURE"
    );
  }

  if (
    !Number.isInteger(maxOutputTokens) ||
    maxOutputTokens < 1
  ) {
    throw createLLMError(
      "maxOutputTokens must be a positive integer.",
      "INVALID_TOKEN_LIMIT"
    );
  }

  if (
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1000
  ) {
    throw createLLMError(
      "timeoutMs must be at least 1000.",
      "INVALID_TIMEOUT"
    );
  }

  // STEP 2: Initialize Gemini
  const client = getGeminiClient();

  // STEP 3: Build request
  const config = {
    temperature,
    maxOutputTokens,
    abortSignal: AbortSignal.timeout(timeoutMs)
  };

  if (systemPrompt.trim()) {
    config.systemInstruction = systemPrompt.trim();
  }

  try {

    // STEP 4: Call Gemini API
    const response = await client.models.generateContent({
      model: model.trim(),
      contents: prompt.trim(),
      config
    });

    // STEP 5: Extract generated text
    const text = extractGeminiText(response);

    if (!text) {
      throw createLLMError(
        "Gemini returned an empty response.",
        "EMPTY_RESPONSE"
      );
    }

    // STEP 6: Return plain text
    return text;

  } catch (error) {

    if (
      error.code === "EMPTY_RESPONSE" ||
      error.name === "AbortError" ||
      error.name === "TimeoutError"
    ) {
      throw error;
    }

    // Do not expose provider error details
    // or sensitive request information.
    throw createLLMError(
      "Gemini text generation failed.",
      "API_ERROR"
    );
  }
}

/**
 * Check whether Gemini is configured.
 *
 * This does not make an API request.
 */
function isLLMConfigured() {
  return Boolean(
    process.env.GEMINI_API_KEY?.trim()
  );
}

module.exports = {
  generateText,
  extractGeminiText,
  isLLMConfigured
};
