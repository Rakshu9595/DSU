
const VALID_DEVICE_TYPES = [
  "ac",
  "refrigerator",
  "washing_machine",
  "fan",
  "lighting",
  "computer",
  "tv",
  "pump",
  "other"
];

function toOptionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} must be a valid non-negative number.`);
  }

  return number;
}

export function createDeviceContext(device = {}) {
  if (!device || typeof device !== "object" || Array.isArray(device)) {
    throw new Error("Device information must be an object.");
  }

  const name =
    typeof device.name === "string" && device.name.trim()
      ? device.name.trim()
      : "Unknown device";

  const rawType =
    typeof device.type === "string"
      ? device.type.trim().toLowerCase()
      : "other";

  const type = VALID_DEVICE_TYPES.includes(rawType)
    ? rawType
    : "other";

  const powerWatts = toOptionalNumber(
    device.powerWatts,
    "powerWatts"
  );

  const dailyUsageHours = toOptionalNumber(
    device.dailyUsageHours,
    "dailyUsageHours"
  );

  if (dailyUsageHours !== null && dailyUsageHours > 24) {
    throw new Error("dailyUsageHours cannot exceed 24.");
  }

  const temperatureCelsius =
    device.temperatureCelsius === undefined ||
    device.temperatureCelsius === null ||
    device.temperatureCelsius === ""
      ? null
      : Number(device.temperatureCelsius);

  if (
    temperatureCelsius !== null &&
    !Number.isFinite(temperatureCelsius)
  ) {
    throw new Error("temperatureCelsius must be a valid number.");
  }

  const status =
    typeof device.status === "string" && device.status.trim()
      ? device.status.trim().toLowerCase()
      : "unknown";

  const context = {
    name,
    type,
    status,
    powerWatts,
    dailyUsageHours,
    temperatureCelsius,
    location:
      typeof device.location === "string"
        ? device.location.trim()
        : null,
    source:
      typeof device.source === "string"
        ? device.source.trim()
        : "user-provided",
    timestamp:
      typeof device.timestamp === "string"
        ? device.timestamp
        : null
  };

  // Calculate estimated daily energy only when both inputs exist.
  context.estimatedDailyEnergyKWh =
    powerWatts !== null && dailyUsageHours !== null
      ? Number(((powerWatts * dailyUsageHours) / 1000).toFixed(3))
      : null;

  return context;
}

export function formatDeviceContext(device) {
  const context = createDeviceContext(device);

  return [
    `Device name: ${context.name}`,
    `Device type: ${context.type}`,
    `Status: ${context.status}`,
    `Power rating: ${
      context.powerWatts !== null
        ? `${context.powerWatts} W`
        : "Not provided"
    }`,
    `Daily usage: ${
      context.dailyUsageHours !== null
        ? `${context.dailyUsageHours} hours`
        : "Not provided"
    }`,
    `Estimated daily energy: ${
      context.estimatedDailyEnergyKWh !== null
        ? `${context.estimatedDailyEnergyKWh} kWh`
        : "Cannot calculate without power and usage data"
    }`,
    `Temperature: ${
      context.temperatureCelsius !== null
        ? `${context.temperatureCelsius} °C`
        : "Not provided"
    }`,
    `Location: ${context.location || "Not provided"}`,
    `Data source: ${context.source}`
  ].join("\n");
}

export default createDeviceContext;
