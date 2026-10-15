
/**
 * Create a structured tool error.
 */
function createToolError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Check whether a value is a non-empty identifier.
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
 * Return a safe subset of device fields.
 *
 * This prevents accidental exposure of
 * internal database fields and metadata.
 */
function sanitizeDevice(device) {
  if (!isValidObject(device)) {
    throw createToolError(
      "Invalid device data.",
      "INVALID_DEVICE_DATA"
    );
  }

  const allowedFields = [
    "deviceId",
    "name",
    "type",
    "category",
    "brand",
    "model",
    "location",
    "powerWatts",
    "dailyHours",
    "quantity",
    "status",
    "ratingSource",
    "createdAt",
    "updatedAt"
  ];

  const safeDevice = {};

  for (const field of allowedFields) {
    if (
      Object.prototype.hasOwnProperty.call(
        device,
        field
      )
    ) {
      safeDevice[field] = device[field];
    }
  }

  return safeDevice;
}

/**
 * Retrieve device details.
 *
 * @param {Object} params
 * @param {string} params.deviceId
 * @param {string} params.projectId
 * @param {string} params.userId
 * @param {Function} params.authorizeAccess
 * @param {Function} params.findDevice
 *
 * @returns {Promise<Object>}
 */
async function getDeviceDetails({
  deviceId,
  projectId,
  userId,
  authorizeAccess,
  findDevice
} = {}) {

  // STEP 1: Validate identifiers
  if (!isValidIdentifier(deviceId)) {
    throw createToolError(
      "A valid device ID is required.",
      "INVALID_DEVICE_ID"
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

  // STEP 2: Validate backend dependencies
  if (typeof authorizeAccess !== "function") {
    throw createToolError(
      "Authorization function is required.",
      "MISSING_AUTHORIZATION"
    );
  }

  if (typeof findDevice !== "function") {
    throw createToolError(
      "Device retrieval function is required.",
      "MISSING_DEVICE_REPOSITORY"
    );
  }

  // STEP 3: Verify user access
  const authorized = await authorizeAccess({
    userId: userId.trim(),
    projectId: projectId.trim()
  });

  if (authorized !== true) {
    throw createToolError(
      "Access to this project is denied.",
      "ACCESS_DENIED"
    );
  }

  // STEP 4: Retrieve device from backend
  // findDevice MUST filter by both deviceId
  // and projectId to prevent cross-project access.
  const device = await findDevice({
    deviceId: deviceId.trim(),
    projectId: projectId.trim()
  });

  // STEP 5: Handle missing device
  if (!device) {
    return {
      success: false,
      found: false,
      message: "Device not found.",
      device: null
    };
  }

  // STEP 6: Convert Mongoose document if needed
  const deviceData =
    typeof device.toObject === "function"
      ? device.toObject()
      : device;

  if (!isValidObject(deviceData)) {
    throw createToolError(
      "Invalid device data returned by backend.",
      "INVALID_DEVICE_DATA"
    );
  }

  // STEP 7: Confirm project ownership
  // The repository should return the projectId
  // for an additional ownership check.
  const storedProjectId =
    deviceData.projectId ??
    deviceData.project?.toString?.();

  if (
    storedProjectId === undefined ||
    String(storedProjectId) !== projectId.trim()
  ) {
    throw createToolError(
      "Device project verification failed.",
      "ACCESS_DENIED"
    );
  }

  // STEP 8: Sanitize device details
  const safeDevice = sanitizeDevice(deviceData);

  // Ensure the requested ID is represented
  if (!safeDevice.deviceId) {
    safeDevice.deviceId = deviceId.trim();
  }

  // STEP 9: Return structured result
  return {
    success: true,
    found: true,
    device: safeDevice,
    source: "backend",
    retrievedAt: new Date().toISOString()
  };
}

/**
 * Export the tool functions.
 */
module.exports = {
  getDeviceDetails,
  sanitizeDevice,
  isValidIdentifier
};
