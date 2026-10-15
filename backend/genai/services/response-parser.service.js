const RESPONSE_TYPES = Object.freeze({
  TEXT: "text",
  JSON: "json"
});

/**
 * Create an error with a stable code.
 */
function createParserError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Extract text from a string or supported
 * LLM response object.
 *
 * @param {string|Object} response
 * @returns {string}
 */
function extractResponseText(response) {

  // Case 1: Plain string response
  if (typeof response === "string") {
    return response.trim();
  }

  if (
    response === null ||
    typeof response !== "object" ||
    Array.isArray(response)
  ) {
    throw createParserError(
      "Invalid AI response format.",
      "INVALID_RESPONSE"
    );
  }

  // Case 2: Our llm.service.js contract
  if (typeof response.text === "string") {
    return response.text.trim();
  }

  // Case 3: Alternative answer format
  if (typeof response.answer === "string") {
    return response.answer.trim();
  }

  // Case 4: Gemini candidate content
  const parts = response.candidates?.[0]?.content?.parts;

  if (Array.isArray(parts)) {
    return parts
      .filter(
        (part) =>
          part &&
          typeof part.text === "string"
      )
      .map((part) => part.text)
      .join("")
      .trim();
  }

  throw createParserError(
    "Unable to extract text from AI response.",
    "INVALID_RESPONSE"
  );
}

/**
 * Remove Markdown code fences surrounding
 * an entire JSON response.
 *
 * Examples:
 *
 * ```json
 * {"success":true}
 * ```
 *
 * becomes:
 *
 * {"success":true}
 */
function removeMarkdownCodeFences(text) {
  if (typeof text !== "string") {
    throw createParserError(
      "Response must be a string.",
      "INVALID_RESPONSE"
    );
  }

  const trimmed = text.trim();

  const fencedMatch = trimmed.match(
    /^```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n?```$/i
  );

  return fencedMatch
    ? fencedMatch[1].trim()
    : trimmed;
}

/**
 * Parse an AI-generated JSON response.
 *
 * @param {string|Object} response
 * @returns {Object|Array}
 */
function parseJSONResponse(response) {
  const text = extractResponseText(response);

  if (!text) {
    throw createParserError(
      "AI returned an empty response.",
      "EMPTY_RESPONSE"
    );
  }

  const cleaned = removeMarkdownCodeFences(text);

  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw createParserError(
      "AI returned invalid JSON.",
      "INVALID_RESPONSE"
    );
  }

  // Only objects and arrays are accepted
  if (
    parsed === null ||
    typeof parsed !== "object"
  ) {
    throw createParserError(
      "Expected a JSON object or array.",
      "INVALID_RESPONSE"
    );
  }

  return parsed;
}

/**
 * Parse a plain text AI response.
 *
 * @param {string|Object} response
 * @returns {string}
 */
function parseTextResponse(response) {
  const text = extractResponseText(response);

  if (!text) {
    throw createParserError(
      "AI returned an empty text response.",
      "EMPTY_RESPONSE"
    );
  }

  return text;
}

/**
 * Validate the basic structure of a parsed
 * JSON response.
 *
 * This is not full schema validation.
 *
 * @param {Object|Array} data
 * @param {Object} options
 * @param {Array<string>} options.requiredFields
 * @param {boolean} options.allowArray
 * @returns {Object|Array}
 */
function validateResponseStructure(
  data,
  {
    requiredFields = [],
    allowArray = false
  } = {}
) {

  if (
    !Array.isArray(requiredFields) ||
    !requiredFields.every(
      (field) =>
        typeof field === "string" &&
        field.trim().length > 0
    )
  ) {
    throw createParserError(
      "requiredFields must be an array of strings.",
      "INVALID_PARSER_OPTIONS"
    );
  }

  if (typeof allowArray !== "boolean") {
    throw createParserError(
      "allowArray must be a boolean.",
      "INVALID_PARSER_OPTIONS"
    );
  }

  if (Array.isArray(data)) {
    if (!allowArray) {
      throw createParserError(
        "An array response is not allowed.",
        "INVALID_RESPONSE"
      );
    }

    if (requiredFields.length > 0) {
      throw createParserError(
        "requiredFields cannot validate array items.",
        "INVALID_PARSER_OPTIONS"
      );
    }

    return data;
  }

  if (
    data === null ||
    typeof data !== "object"
  ) {
    throw createParserError(
      "Expected a JSON object.",
      "INVALID_RESPONSE"
    );
  }

  // Verify required fields exist
  for (const field of requiredFields) {
    if (!Object.hasOwn(data, field)) {
      throw createParserError(
        `Missing required response field: ${field}`,
        "INVALID_RESPONSE"
      );
    }
  }

  return data;
}

/**
 * Main response parser.
 *
 * @param {Object} params
 * @param {string|Object} params.response
 * @param {string} params.type
 * @param {Array<string>} params.requiredFields
 * @param {boolean} params.allowArray
 *
 * @returns {Object}
 */
function parseAIResponse({
  response,
  type = RESPONSE_TYPES.TEXT,
  requiredFields = [],
  allowArray = false
} = {}) {

  if (!Object.values(RESPONSE_TYPES).includes(type)) {
    throw createParserError(
      "Unsupported response type.",
      "INVALID_PARSER_OPTIONS"
    );
  }

  let parsedData;

  if (type === RESPONSE_TYPES.JSON) {

    parsedData = parseJSONResponse(response);

    parsedData = validateResponseStructure(
      parsedData,
      {
        requiredFields,
        allowArray
      }
    );

  } else {

    parsedData = parseTextResponse(response);

  }

  return {
    success: true,
    type,
    data: parsedData,
    parsedAt: new Date().toISOString()
  };
}

/**
 * Safely attempt parsing without throwing.
 *
 * Useful when the caller prefers a
 * structured failure response.
 */
function safeParseAIResponse(options = {}) {
  try {
    return parseAIResponse(options);
  } catch (error) {
    return {
      success: false,
      type: null,
      data: null,
      error: {
        code: error.code || "INVALID_RESPONSE",
        message: error.message
      },
      parsedAt: new Date().toISOString()
    };
  }
}

module.exports = {
  RESPONSE_TYPES,
  extractResponseText,
  removeMarkdownCodeFences,
  parseJSONResponse,
  parseTextResponse,
  validateResponseStructure,
  parseAIResponse,
  safeParseAIResponse
};
