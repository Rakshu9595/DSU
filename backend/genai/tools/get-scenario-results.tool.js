
/**
 * get-scenario-results.tool.js
 *
 * Retrieves scenario comparison results for the
 * DSU Energy Management and Sustainability System.
 *
 * Responsibilities:
 * 1. Validate scenario, project and user IDs.
 * 2. Verify project authorization.
 * 3. Retrieve saved scenario results.
 * 4. Verify scenario belongs to the project.
 * 5. Validate and sanitize scenario data.
 * 6. Return structured results to GenAI services.
 *
 * IMPORTANT:
 * - Does not call Gemini.
 * - Does not calculate energy savings.
 * - Does not invent missing results.
 * - Uses trusted backend scenario calculations.
 */

const ALLOWED_SCENARIO_FIELDS = Object.freeze([
  "scenarioName",
  "description",
  "status",
  "calculationType",
  "dataSource",
  "createdAt",
  "updatedAt"
]);

const ALLOWED_RESULT_FIELDS = Object.freeze([
  "energyKWh",
  "dailyKWh",
  "monthlyKWh",
  "yearlyKWh",
  "operatingHoursPerDay",
  "cost",
  "dailyCost",
  "monthlyCost",
  "yearlyCost",
  "currency"
]);

const ALLOWED_COMPARISON_FIELDS = Object.freeze([
  "dailyEnergySavingsKWh",
  "monthlyEnergySavingsKWh",
  "yearlyEnergySavingsKWh",
  "energySavingsKWh",
  "savingsPercentage",
  "dailyCostSavings",
  "monthlyCostSavings",
  "yearlyCostSavings",
  "costSavings",
  "costSavingsPercentage"
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
 * Check for a plain object.
 */
function isValidObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * Validate a finite non-negative number.
 */
function isValidNonNegativeNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

/**
 * Normalize dates from MongoDB or plain objects.
 */
function normalizeDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw createToolError(
        "Invalid scenario date.",
        "INVALID_SCENARIO_DATA"
      );
    }

    return value.toISOString();
  }

  if (
    typeof value === "string" &&
    value.trim() &&
    !Number.isNaN(Date.parse(value))
  ) {
    return value.trim();
  }

  throw createToolError(
    "Invalid scenario date.",
    "INVALID_SCENARIO_DATA"
  );
}

/**
 * Sanitize baseline or proposed results.
 *
 * @param {Object} result
 * @returns {Object}
 */
function sanitizeScenarioMetrics(result) {
  if (!isValidObject(result)) {
    throw createToolError(
      "Scenario metrics must be an object.",
      "INVALID_SCENARIO_DATA"
    );
  }

  const safeResult = {};

  for (const field of ALLOWED_RESULT_FIELDS) {
    if (!Object.hasOwn(result, field)) {
      continue;
    }

    const value = result[field];

    if (field === "currency") {
      if (
        typeof value !== "string" ||
        !/^[A-Z]{3}$/.test(value)
      ) {
        throw createToolError(
          "Currency must be a three-letter code.",
          "INVALID_SCENARIO_DATA"
        );
      }

      safeResult.currency = value;
      continue;
    }

    if (!isValidNonNegativeNumber(value)) {
      throw createToolError(
        `Invalid value for ${field}.`,
        "INVALID_SCENARIO_DATA"
      );
    }

    safeResult[field] = value;
  }

  if (Object.keys(safeResult).length === 0) {
    throw createToolError(
      "Scenario metrics contain no supported fields.",
      "INVALID_SCENARIO_DATA"
    );
  }

  return safeResult;
}

/**
 * Sanitize comparison results.
 *
 * Negative savings can represent increased
 * consumption or cost, so signed finite
 * values are permitted for savings fields.
 */
function sanitizeScenarioComparison(comparison) {
  if (!isValidObject(comparison)) {
    throw createToolError(
      "Scenario comparison must be an object.",
      "INVALID_SCENARIO_DATA"
    );
  }

  const safeComparison = {};

  for (const field of ALLOWED_COMPARISON_FIELDS) {
    if (!Object.hasOwn(comparison, field)) {
      continue;
    }

    const value = comparison[field];

    if (
      typeof value !== "number" ||
      !Number.isFinite(value)
    ) {
      throw createToolError(
        `Invalid comparison value for ${field}.`,
        "INVALID_SCENARIO_DATA"
      );
    }

    safeComparison[field] = value;
  }

  return safeComparison;
}

/**
 * Sanitize the complete scenario.
 */
function sanitizeScenarioResults(scenario) {
  if (!isValidObject(scenario)) {
    throw createToolError(
      "Invalid scenario result.",
      "INVALID_SCENARIO_DATA"
    );
  }

  if (
    !isValidObject(scenario.baseline) ||
    !isValidObject(scenario.proposed)
  ) {
    throw createToolError(
      "Baseline and proposed results are required.",
      "INVALID_SCENARIO_DATA"
    );
  }

  const safeScenario = {};

  // STEP 1: Sanitize descriptive fields
  for (const field of ALLOWED_SCENARIO_FIELDS) {
    if (!Object.hasOwn(scenario, field)) {
      continue;
    }

    const value = scenario[field];

    if (
      field === "createdAt" ||
      field === "updatedAt"
    ) {
      safeScenario[field] = normalizeDate(value);
      continue;
    }

    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.length > 2000
    ) {
      throw createToolError(
        `Invalid scenario field: ${field}.`,
        "INVALID_SCENARIO_DATA"
      );
    }

    safeScenario[field] = value.trim();
  }

  // STEP 2: Sanitize baseline results
  safeScenario.baseline =
    sanitizeScenarioMetrics(scenario.baseline);

  // STEP 3: Sanitize proposed results
  safeScenario.proposed =
    sanitizeScenarioMetrics(scenario.proposed);

  // STEP 4: Sanitize optional comparison
  if (scenario.comparison !== undefined) {
    safeScenario.comparison =
      sanitizeScenarioComparison(
        scenario.comparison
      );
  }

  // STEP 5: Ensure currencies agree
  const baselineCurrency =
    safeScenario.baseline.currency;

  const proposedCurrency =
    safeScenario.proposed.currency;

  if (
    baselineCurrency &&
    proposedCurrency &&
    baselineCurrency !== proposedCurrency
  ) {
    throw createToolError(
      "Scenario currencies do not match.",
      "INVALID_SCENARIO_DATA"
    );
  }

  return safeScenario;
}

/**
 * Retrieve scenario results.
 *
 * @param {Object} params
 * @param {string} params.scenarioId
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {Function} params.authorizeAccess
 * @param {Function} params.findScenarioResults
 *
 * @returns {Promise<Object>}
 */
async function getScenarioResults({
  scenarioId,
  projectId,
  userId,
  authorizeAccess,
  findScenarioResults
} = {}) {

  // STEP 1: Validate identifiers
  if (!isValidIdentifier(scenarioId)) {
    throw createToolError(
      "A valid scenario ID is required.",
      "INVALID_SCENARIO_ID"
    );
  }

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

  // STEP 2: Validate dependencies
  if (typeof authorizeAccess !== "function") {
    throw createToolError(
      "Authorization function is required.",
      "MISSING_AUTHORIZATION"
    );
  }

  if (typeof findScenarioResults !== "function") {
    throw createToolError(
      "Scenario retrieval function is required.",
      "MISSING_SCENARIO_REPOSITORY"
    );
  }

  const normalizedScenarioId = scenarioId.trim();
  const normalizedProjectId = projectId.trim();
  const normalizedUserId = userId.trim();

  // STEP 3: Verify project access
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

  // STEP 4: Retrieve scenario from backend
  // Repository must filter by both IDs.
  const scenario = await findScenarioResults({
    scenarioId: normalizedScenarioId,
    projectId: normalizedProjectId
  });

  // STEP 5: Handle missing scenario
  if (scenario === null || scenario === undefined) {
    return {
      success: false,
      found: false,
      message: "Scenario results not found.",
      scenario: null
    };
  }

  // STEP 6: Convert Mongoose document
  const scenarioData =
    typeof scenario.toObject === "function"
      ? scenario.toObject()
      : scenario;

  if (!isValidObject(scenarioData)) {
    throw createToolError(
      "Invalid scenario data returned by backend.",
      "INVALID_SCENARIO_DATA"
    );
  }

  // STEP 7: Verify project ownership
  const storedProjectId =
    scenarioData.projectId ??
    scenarioData.project;

  if (
    storedProjectId === undefined ||
    String(storedProjectId) !== normalizedProjectId
  ) {
    throw createToolError(
      "Scenario project verification failed.",
      "ACCESS_DENIED"
    );
  }

  // STEP 8: Verify scenario identity
  const storedScenarioId =
    scenarioData.scenarioId ??
    scenarioData._id;

  if (
    storedScenarioId === undefined ||
    String(storedScenarioId) !== normalizedScenarioId
  ) {
    throw createToolError(
      "Scenario identity verification failed.",
      "ACCESS_DENIED"
    );
  }

  // STEP 9: Sanitize results
  const safeScenario =
    sanitizeScenarioResults(scenarioData);

  // STEP 10: Add verified IDs
  safeScenario.scenarioId = normalizedScenarioId;
  safeScenario.projectId = normalizedProjectId;

  // STEP 11: Return structured results
  return {
    success: true,
    found: true,
    scenario: safeScenario,
    source: "backend",
    retrievedAt: new Date().toISOString()
  };
}

module.exports = {
  ALLOWED_SCENARIO_FIELDS,
  ALLOWED_RESULT_FIELDS,
  ALLOWED_COMPARISON_FIELDS,
  isValidIdentifier,
  sanitizeScenarioMetrics,
  sanitizeScenarioComparison,
  sanitizeScenarioResults,
  getScenarioResults
};
