
/**
 * get-energy-summary.tool.js
 *
 * Retrieves trusted energy consumption summaries
 * for the DSU Energy Management and
 * Sustainability System.
 *
 * Responsibilities:
 * 1. Validate project and user identifiers.
 * 2. Validate the requested time period.
 * 3. Verify user authorization.
 * 4. Retrieve energy summary from the backend.
 * 5. Validate numerical energy data.
 * 6. Return a structured, safe response.
 *
 * IMPORTANT:
 * This tool does not call Gemini.
 * This tool does not invent energy measurements.
 * All energy calculations must be performed
 * by trusted backend services.
 */

const ALLOWED_PERIODS = Object.freeze([
  "daily",
  "weekly",
  "monthly",
  "yearly"
]);

const ALLOWED_NUMERIC_FIELDS = Object.freeze([
  "totalEnergyKWh",
  "averageDailyKWh",
  "peakEnergyKWh",
  "totalCost",
  "totalDevices",
  "activeDevices",
  "estimatedSavingsKWh",
  "estimatedSavingsCost"
]);

const ALLOWED_TEXT_FIELDS = Object.freeze([
  "currency",
  "calculationType",
  "dataSource",
  "startDate",
  "endDate"
]);

/**
 * Create an error with a stable code.
 */
function createToolError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Validate identifiers.
 */
function isValidIdentifier(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 200
  );
}

/**
 * Check whether a value is an object.
 */
function isValidObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Validate an ISO date string (YYYY-MM-DD).
 */
function isValidDateString(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

/**
 * Validate an optional date range.
 */
function validateDateRange(startDate, endDate) {
  if (
    startDate !== undefined &&
    !isValidDateString(startDate)
  ) {
    throw createToolError(
      "startDate must use YYYY-MM-DD format.",
      "INVALID_DATE_RANGE"
    );
  }

  if (
    endDate !== undefined &&
    !isValidDateString(endDate)
  ) {
    throw createToolError(
      "endDate must use YYYY-MM-DD format.",
      "INVALID_DATE_RANGE"
    );
  }

  if (
    startDate !== undefined &&
    endDate !== undefined &&
    startDate > endDate
  ) {
    throw createToolError(
      "startDate cannot be after endDate.",
      "INVALID_DATE_RANGE"
    );
  }
}

/**
 * Sanitize and validate energy summary data.
 *
 * Only approved fields are returned.
 * Missing values remain missing; they are
 * not replaced with invented zero values.
 */
function sanitizeEnergySummary(summary) {
  if (!isValidObject(summary)) {
    throw createToolError(
      "Invalid energy summary data.",
      "INVALID_ENERGY_DATA"
    );
  }

  const safeSummary = {};

  for (const field of ALLOWED_NUMERIC_FIELDS) {
    if (!Object.hasOwn(summary, field)) {
      continue;
    }

    const value = summary[field];

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      throw createToolError(
        `Invalid numerical value for ${field}.`,
        "INVALID_ENERGY_DATA"
      );
    }

    if (
      ["totalDevices", "activeDevices"].includes(field) &&
      !Number.isInteger(value)
    ) {
      throw createToolError(
        `${field} must be an integer.`,
        "INVALID_ENERGY_DATA"
      );
    }

    safeSummary[field] = value;
  }

  if (
    safeSummary.activeDevices !== undefined &&
    safeSummary.totalDevices !== undefined &&
    safeSummary.activeDevices > safeSummary.totalDevices
  ) {
    throw createToolError(
      "Active devices cannot exceed total devices.",
      "INVALID_ENERGY_DATA"
    );
  }

  for (const field of ALLOWED_TEXT_FIELDS) {
    if (!Object.hasOwn(summary, field)) {
      continue;
    }

    const value = summary[field];

    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value.length > 200
    ) {
      throw createToolError(
        `Invalid value for ${field}.`,
        "INVALID_ENERGY_DATA"
      );
    }

    if (
      ["startDate", "endDate"].includes(field) &&
      !isValidDateString(value)
    ) {
      throw createToolError(
        `Invalid date in ${field}.`,
        "INVALID_ENERGY_DATA"
      );
    }

    safeSummary[field] = value.trim();
  }

  if (
    safeSummary.startDate &&
    safeSummary.endDate &&
    safeSummary.startDate > safeSummary.endDate
  ) {
    throw createToolError(
      "Summary date range is invalid.",
      "INVALID_ENERGY_DATA"
    );
  }

  if (Object.keys(safeSummary).length === 0) {
    throw createToolError(
      "Energy summary contains no supported fields.",
      "INVALID_ENERGY_DATA"
    );
  }

  return safeSummary;
}

/**
 * Retrieve the energy summary for a project.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {string} params.period
 * @param {string} params.startDate
 * @param {string} params.endDate
 * @param {Function} params.authorizeAccess
 * @param {Function} params.findEnergySummary
 *
 * @returns {Promise<Object>}
 */
async function getEnergySummary({
  projectId,
  userId,
  period = "monthly",
  startDate,
  endDate,
  authorizeAccess,
  findEnergySummary
} = {}) {

  // STEP 1: Validate identifiers
  if (!isValidIdentifier(projectId)) {
    throw createToolError(
      "A valid project ID is required.",
      "INVALID_PROJECT_ID"
    );
  }

  if (!isValidIdentifier(userId)) {
    throw createToolError(
      "A valid user ID is required.",
      "INVALID_USER_ID"
    );
  }

  // STEP 2: Validate time period
  if (!ALLOWED_PERIODS.includes(period)) {
    throw createToolError(
      "Period must be daily, weekly, monthly, or yearly.",
      "INVALID_PERIOD"
    );
  }

  // STEP 3: Validate optional dates
  validateDateRange(startDate, endDate);

  // STEP 4: Validate backend functions
  if (typeof authorizeAccess !== "function") {
    throw createToolError(
      "Authorization function is required.",
      "MISSING_AUTHORIZATION"
    );
  }

  if (typeof findEnergySummary !== "function") {
    throw createToolError(
      "Energy summary retrieval function is required.",
      "MISSING_ENERGY_REPOSITORY"
    );
  }

  const normalizedProjectId = projectId.trim();
  const normalizedUserId = userId.trim();

  // STEP 5: Verify user access
  const authorized = await authorizeAccess({
    userId: normalizedUserId,
    projectId: normalizedProjectId
  });

  if (authorized !== true) {
    throw createToolError(
      "Access to this project is denied.",
      "ACCESS_DENIED"
    );
  }

  // STEP 6: Retrieve trusted energy data
  const summary = await findEnergySummary({
    projectId: normalizedProjectId,
    period,
    startDate,
    endDate
  });

  // STEP 7: Handle missing summary
  if (summary === null || summary === undefined) {
    return {
      success: false,
      found: false,
      message: "No energy summary found for this period.",
      summary: null
    };
  }

  // STEP 8: Normalize database result
  const summaryData =
    typeof summary.toObject === "function"
      ? summary.toObject()
      : summary;

  if (!isValidObject(summaryData)) {
    throw createToolError(
      "Invalid energy summary returned by backend.",
      "INVALID_ENERGY_DATA"
    );
  }

  // STEP 9: Verify project ownership
  // The repository must return projectId
  // and filter by projectId in its query.
  const storedProjectId =
    summaryData.projectId ??
    summaryData.project?.toString?.();

  if (
    storedProjectId === undefined ||
    String(storedProjectId) !== normalizedProjectId
  ) {
    throw createToolError(
      "Energy summary project verification failed.",
      "ACCESS_DENIED"
    );
  }

  // STEP 10: Sanitize energy information
  const safeSummary = sanitizeEnergySummary(summaryData);

  // STEP 11: Return structured response
  return {
    success: true,
    found: true,
    projectId: normalizedProjectId,
    period,
    summary: safeSummary,
    source: "backend",
    retrievedAt: new Date().toISOString()
  };
}

module.exports = {
  ALLOWED_PERIODS,
  isValidIdentifier,
  isValidDateString,
  validateDateRange,
  sanitizeEnergySummary,
  getEnergySummary
};
