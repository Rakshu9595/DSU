const FALLBACK_TYPES = Object.freeze({
  API_ERROR: "API_ERROR",
  TIMEOUT: "TIMEOUT",
  EMPTY_RESPONSE: "EMPTY_RESPONSE",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  MISSING_DATA: "MISSING_DATA",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  UNSUPPORTED_QUERY: "UNSUPPORTED_QUERY",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  UNKNOWN_ERROR: "UNKNOWN_ERROR"
});

const FALLBACK_MESSAGES = Object.freeze({
  [FALLBACK_TYPES.API_ERROR]:
    "The AI service could not process your request right now. Please try again later.",

  [FALLBACK_TYPES.TIMEOUT]:
    "The AI request took too long to complete. Please try again.",

  [FALLBACK_TYPES.EMPTY_RESPONSE]:
    "The AI did not return an answer. Please try asking your question again.",

  [FALLBACK_TYPES.INVALID_RESPONSE]:
    "The AI response could not be validated. Please try again.",

  [FALLBACK_TYPES.MISSING_DATA]:
    "There is not enough project or appliance data available to answer this question accurately.",

  [FALLBACK_TYPES.INSUFFICIENT_EVIDENCE]:
    "The available information is insufficient to confirm this finding. Please provide additional usage or measurement data.",

  [FALLBACK_TYPES.UNSUPPORTED_QUERY]:
    "I can help with electricity consumption, appliances, energy-saving recommendations, scenarios, and sustainability.",

  [FALLBACK_TYPES.SERVICE_UNAVAILABLE]:
    "The AI service is temporarily unavailable. Please try again later.",

  [FALLBACK_TYPES.UNKNOWN_ERROR]:
    "Unable to complete your request right now. Please try again later."
});

/**
 * Check whether a fallback type is supported.
 */
function isValidFallbackType(type) {
  return Object.values(FALLBACK_TYPES).includes(type);
}

/**
 * Determine the fallback type from an error.
 *
 * Avoids relying on confidential error messages.
 *
 * @param {Error|Object} error
 * @returns {string}
 */
function classifyFallbackError(error) {
  if (!error || typeof error !== "object") {
    return FALLBACK_TYPES.UNKNOWN_ERROR;
  }

  const code = String(error.code || "").toUpperCase();
  const status = Number(
    error.status ?? error.statusCode
  );

  const name = String(error.name || "").toLowerCase();

  if (
    code === "ETIMEDOUT" ||
    code === "ESOCKETTIMEDOUT" ||
    code === "ECONNABORTED" ||
    name === "aborterror" ||
    name === "timeouterror" ||
    status === 408 ||
    status === 504
  ) {
    return FALLBACK_TYPES.TIMEOUT;
  }

  if (
    status === 429 ||
    status === 502 ||
    status === 503 ||
    code === "ECONNREFUSED" ||
    code === "ECONNRESET"
  ) {
    return FALLBACK_TYPES.SERVICE_UNAVAILABLE;
  }

  if (
    code === "EMPTY_RESPONSE"
  ) {
    return FALLBACK_TYPES.EMPTY_RESPONSE;
  }

  if (
    code === "INVALID_RESPONSE"
  ) {
    return FALLBACK_TYPES.INVALID_RESPONSE;
  }

  if (
    code === "MISSING_DATA"
  ) {
    return FALLBACK_TYPES.MISSING_DATA;
  }

  if (
    code === "INSUFFICIENT_EVIDENCE"
  ) {
    return FALLBACK_TYPES.INSUFFICIENT_EVIDENCE;
  }

  if (
    code === "UNSUPPORTED_QUERY"
  ) {
    return FALLBACK_TYPES.UNSUPPORTED_QUERY;
  }

  if (
    status === 500 ||
    status === 501 ||
    code === "AI_API_ERROR"
  ) {
    return FALLBACK_TYPES.API_ERROR;
  }

  return FALLBACK_TYPES.UNKNOWN_ERROR;
}

/**
 * Build a structured fallback response.
 *
 * @param {Object} options
 * @param {string} options.type
 * @param {string} options.service
 * @param {string|null} options.requestId
 * @returns {Object}
 */
function generateFallbackResponse({
  type = FALLBACK_TYPES.UNKNOWN_ERROR,
  service = "genai",
  requestId = null
} = {}) {
  const fallbackType = isValidFallbackType(type)
    ? type
    : FALLBACK_TYPES.UNKNOWN_ERROR;

  const safeService =
    typeof service === "string" &&
    /^[a-zA-Z0-9_-]{1,50}$/.test(service)
      ? service
      : "genai";

  const safeRequestId =
    typeof requestId === "string" &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(requestId)
      ? requestId
      : null;

  return {
    success: false,
    fallback: true,
    type: fallbackType,
    service: safeService,
    message: FALLBACK_MESSAGES[fallbackType],
    requestId: safeRequestId,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Handle an AI service error.
 *
 * Logs limited technical information.
 * Does not expose raw error messages to users.
 */
function handleAIFailure(
  error,
  {
    service = "genai",
    requestId = null
  } = {}
) {
  const type = classifyFallbackError(error);

  const response = generateFallbackResponse({
    type,
    service,
    requestId
  });

  console.error("GenAI fallback triggered:", {
    service: response.service,
    type: response.type,
    requestId: response.requestId
  });

  return response;
}

/**
 * Return a safe response when project data
 * is missing or insufficient.
 */
function handleMissingData({
  service = "genai",
  requestId = null,
  insufficientEvidence = false
} = {}) {
  return generateFallbackResponse({
    type: insufficientEvidence
      ? FALLBACK_TYPES.INSUFFICIENT_EVIDENCE
      : FALLBACK_TYPES.MISSING_DATA,
    service,
    requestId
  });
}

/**
 * Check whether an AI text response is usable.
 *
 * This is only basic text validation.
 * Schema and factual validation must be
 * performed by separate services.
 */
function isUsableAIResponse(response) {
  const text =
    typeof response === "string"
      ? response
      : response?.text;

  return (
    typeof text === "string" &&
    text.trim().length > 0
  );
}

module.exports = {
  FALLBACK_TYPES,
  FALLBACK_MESSAGES,
  isValidFallbackType,
  classifyFallbackError,
  generateFallbackResponse,
  handleAIFailure,
  handleMissingData,
  isUsableAIResponse
};
