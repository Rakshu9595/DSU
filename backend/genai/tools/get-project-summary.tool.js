
/**
 * get-project-summary.tool.js
 *
 * Retrieves project information for the
 * DSU Energy Management and Sustainability System.
 *
 * Responsibilities:
 * 1. Validate project and user IDs.
 * 2. Verify user authorization.
 * 3. Retrieve project information.
 * 4. Validate and sanitize project data.
 * 5. Return a structured project summary.
 *
 * IMPORTANT:
 * - This tool does not call Gemini.
 * - It does not calculate electricity usage.
 * - It does not invent project information.
 * - User authorization must be enforced.
 */

const ALLOWED_TEXT_FIELDS = Object.freeze([
  "projectName",
  "description",
  "status",
  "location",
  "department",
  "building",
  "category",
  "startDate",
  "endDate",
  "createdAt",
  "updatedAt"
]);

const ALLOWED_NUMERIC_FIELDS = Object.freeze([
  "totalDevices",
  "activeDevices",
  "totalEnergyKWh",
  "estimatedMonthlyCost",
  "estimatedSavingsKWh",
  "estimatedSavingsPercentage"
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
 * Validate a string identifier.
 */
function isValidIdentifier(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 200
  );
}

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
 * Check whether a numerical value is valid.
 */
function isValidNumber(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
}

/**
 * Convert supported date values into strings.
 */
function normalizeDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw createToolError(
        "Invalid project date.",
        "INVALID_PROJECT_DATA"
      );
    }

    return value.toISOString();
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      !trimmed ||
      trimmed.length > 100 ||
      Number.isNaN(Date.parse(trimmed))
    ) {
      throw createToolError(
        "Invalid project date.",
        "INVALID_PROJECT_DATA"
      );
    }

    return trimmed;
  }

  throw createToolError(
    "Invalid project date format.",
    "INVALID_PROJECT_DATA"
  );
}

/**
 * Validate and sanitize project information.
 *
 * Only approved fields are returned.
 * Missing fields are not replaced with
 * invented values.
 *
 * @param {Object} project
 * @returns {Object}
 */
function sanitizeProjectSummary(project) {
  if (!isValidObject(project)) {
    throw createToolError(
      "Invalid project data.",
      "INVALID_PROJECT_DATA"
    );
  }

  const safeProject = {};

  // STEP 1: Sanitize text and date fields
  for (const field of ALLOWED_TEXT_FIELDS) {
    if (!Object.hasOwn(project, field)) {
      continue;
    }

    const value = project[field];

    if (
      [
        "startDate",
        "endDate",
        "createdAt",
        "updatedAt"
      ].includes(field)
    ) {
      safeProject[field] = normalizeDate(value);
      continue;
    }

    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value.length > 2000
    ) {
      throw createToolError(
        `Invalid value for ${field}.`,
        "INVALID_PROJECT_DATA"
      );
    }

    safeProject[field] = value.trim();
  }

  // STEP 2: Sanitize numerical fields
  for (const field of ALLOWED_NUMERIC_FIELDS) {
    if (!Object.hasOwn(project, field)) {
      continue;
    }

    const value = project[field];

    if (!isValidNumber(value)) {
      throw createToolError(
        `Invalid numerical value for ${field}.`,
        "INVALID_PROJECT_DATA"
      );
    }

    if (
      ["totalDevices", "activeDevices"].includes(field) &&
      !Number.isInteger(value)
    ) {
      throw createToolError(
        `${field} must be an integer.`,
        "INVALID_PROJECT_DATA"
      );
    }

    if (
      field === "estimatedSavingsPercentage" &&
      value > 100
    ) {
      throw createToolError(
        "Savings percentage cannot exceed 100.",
        "INVALID_PROJECT_DATA"
      );
    }

    safeProject[field] = value;
  }

  // STEP 3: Check device counts
  if (
    safeProject.totalDevices !== undefined &&
    safeProject.activeDevices !== undefined &&
    safeProject.activeDevices > safeProject.totalDevices
  ) {
    throw createToolError(
      "Active devices cannot exceed total devices.",
      "INVALID_PROJECT_DATA"
    );
  }

  // STEP 4: Check project date order
  if (
    safeProject.startDate &&
    safeProject.endDate &&
    new Date(safeProject.startDate) >
      new Date(safeProject.endDate)
  ) {
    throw createToolError(
      "Project end date cannot precede start date.",
      "INVALID_PROJECT_DATA"
    );
  }

  if (Object.keys(safeProject).length === 0) {
    throw createToolError(
      "Project contains no supported summary fields.",
      "INVALID_PROJECT_DATA"
    );
  }

  return safeProject;
}

/**
 * Retrieve project summary from backend.
 *
 * @param {Object} params
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {Function} params.authorizeAccess
 * @param {Function} params.findProject
 *
 * @returns {Promise<Object>}
 */
async function getProjectSummary({
  projectId,
  userId,
  authorizeAccess,
  findProject
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

  // STEP 2: Validate dependencies
  if (typeof authorizeAccess !== "function") {
    throw createToolError(
      "Authorization function is required.",
      "MISSING_AUTHORIZATION"
    );
  }

  if (typeof findProject !== "function") {
    throw createToolError(
      "Project retrieval function is required.",
      "MISSING_PROJECT_REPOSITORY"
    );
  }

  const normalizedProjectId = projectId.trim();
  const normalizedUserId = userId.trim();

  // STEP 3: Verify user access
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

  // STEP 4: Retrieve project from backend
  const project = await findProject({
    projectId: normalizedProjectId
  });

  // STEP 5: Handle missing project
  if (project === null || project === undefined) {
    return {
      success: false,
      found: false,
      message: "Project not found.",
      project: null
    };
  }

  // STEP 6: Convert Mongoose document
  const projectData =
    typeof project.toObject === "function"
      ? project.toObject()
      : project;

  if (!isValidObject(projectData)) {
    throw createToolError(
      "Invalid project data returned by backend.",
      "INVALID_PROJECT_DATA"
    );
  }

  // STEP 7: Verify returned project ID
  const storedProjectId =
    projectData.projectId ??
    projectData._id?.toString?.();

  if (
    storedProjectId === undefined ||
    String(storedProjectId) !== normalizedProjectId
  ) {
    throw createToolError(
      "Project identity verification failed.",
      "ACCESS_DENIED"
    );
  }

  // STEP 8: Sanitize project information
  const safeProject = sanitizeProjectSummary(
    projectData
  );

  // STEP 9: Add verified project identifier
  safeProject.projectId = normalizedProjectId;

  // STEP 10: Return structured summary
  return {
    success: true,
    found: true,
    project: safeProject,
    source: "backend",
    retrievedAt: new Date().toISOString()
  };
}

/**
 * Export the tool functions.
 */
module.exports = {
  ALLOWED_TEXT_FIELDS,
  ALLOWED_NUMERIC_FIELDS,
  isValidIdentifier,
  isValidObject,
  sanitizeProjectSummary,
  getProjectSummary
};

