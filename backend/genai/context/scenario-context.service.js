
const VALID_SCENARIOS = [
  "appliance_left_on",
  "excessive_usage",
  "standby_energy",
  "high_energy_consumption",
  "energy_saving_opportunity",
  "room_energy_analysis",
  "custom"
];

function optionalNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }

  return number;
}

function optionalText(value, fallback = null) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : fallback;
}

/**
 * Creates a normalized scenario context for VisionTwin.
 *
 * Scenario inputs should come from computer-vision results,
 * user-provided information, or documented assumptions.
 */
export function createScenarioContext(scenario = {}) {
  if (
    !scenario ||
    typeof scenario !== "object" ||
    Array.isArray(scenario)
  ) {
    throw new Error("Scenario information must be an object.");
  }

  const requestedType = optionalText(scenario.type, "custom")
    .toLowerCase();

  const type = VALID_SCENARIOS.includes(requestedType)
    ? requestedType
    : "custom";

  const durationHours = optionalNonNegativeNumber(
    scenario.durationHours,
    "durationHours"
  );

  if (durationHours !== null && durationHours > 24) {
    throw new Error("durationHours cannot exceed 24.");
  }

  const powerWatts = optionalNonNegativeNumber(
    scenario.powerWatts,
    "powerWatts"
  );

  const baselineHours = optionalNonNegativeNumber(
    scenario.baselineHours,
    "baselineHours"
  );

  if (baselineHours !== null && baselineHours > 24) {
    throw new Error("baselineHours cannot exceed 24.");
  }

  const additionalUsageHours =
    durationHours !== null && baselineHours !== null
      ? Math.max(0, durationHours - baselineHours)
      : null;

  const estimatedAdditionalEnergyKWh =
    powerWatts !== null && additionalUsageHours !== null
      ? Number(
          ((powerWatts * additionalUsageHours) / 1000).toFixed(3)
        )
      : null;

  const evidenceSource = optionalText(
    scenario.evidenceSource,
    "user-provided"
  );

  const confidence =
    typeof scenario.confidence === "number" &&
    Number.isFinite(scenario.confidence) &&
    scenario.confidence >= 0 &&
    scenario.confidence <= 1
      ? scenario.confidence
      : null;

  return {
    id: optionalText(scenario.id, `scenario-${Date.now()}`),
    type,
    title: optionalText(scenario.title, "Energy-use scenario"),
    description: optionalText(
      scenario.description,
      "No scenario description provided."
    ),

    deviceName: optionalText(scenario.deviceName, "Unknown device"),
    room: optionalText(scenario.room, "Unknown room"),

    observedStatus: optionalText(
      scenario.observedStatus,
      "unknown"
    ).toLowerCase(),

    durationHours,
    baselineHours,
    powerWatts,

    additionalUsageHours,
    estimatedAdditionalEnergyKWh,

    evidenceSource,
    confidence,

    status: "requires_evaluation",

    limitations: [
      "A visible appliance does not prove that it is consuming electricity.",
      "A detected switch position does not confirm actual electrical power.",
      "Additional energy is estimated only when power and baseline usage data are provided.",
      "A scenario is not a verified energy violation or measured energy loss."
    ]
  };
}

/**
 * Creates multiple scenario contexts.
 */
export function createScenarioContexts(scenarios = []) {
  if (!Array.isArray(scenarios)) {
    throw new Error("scenarios must be an array.");
  }

  return scenarios.map((scenario) =>
    createScenarioContext(scenario)
  );
}

/**
 * Formats scenario information for the GenAI prompt.
 */
export function formatScenarioContext(scenarioContext) {
  if (
    !scenarioContext ||
    typeof scenarioContext !== "object" ||
    Array.isArray(scenarioContext)
  ) {
    throw new Error("A valid scenario context is required.");
  }

  return [
    "VISIONTWIN SCENARIO CONTEXT",
    "",
    `Scenario ID: ${scenarioContext.id}`,
    `Scenario type: ${scenarioContext.type}`,
    `Title: ${scenarioContext.title}`,
    `Description: ${scenarioContext.description}`,
    `Device: ${scenarioContext.deviceName}`,
    `Room: ${scenarioContext.room}`,
    `Observed status: ${scenarioContext.observedStatus}`,
    `Duration: ${
      scenarioContext.durationHours !== null
        ? `${scenarioContext.durationHours} hours`
        : "Not provided"
    }`,
    `Baseline usage: ${
      scenarioContext.baselineHours !== null
        ? `${scenarioContext.baselineHours} hours`
        : "Not provided"
    }`,
    `Power rating: ${
      scenarioContext.powerWatts !== null
        ? `${scenarioContext.powerWatts} W`
        : "Not provided"
    }`,
    `Additional usage: ${
      scenarioContext.additionalUsageHours !== null
        ? `${scenarioContext.additionalUsageHours} hours`
        : "Cannot determine"
    }`,
    `Estimated additional energy: ${
      scenarioContext.estimatedAdditionalEnergyKWh !== null
        ? `${scenarioContext.estimatedAdditionalEnergyKWh} kWh`
        : "Cannot calculate with available data"
    }`,
    `Evidence source: ${scenarioContext.evidenceSource}`,
    `Detection confidence: ${
      scenarioContext.confidence !== null
        ? scenarioContext.confidence
        : "Not available"
    }`,
    `Evaluation status: ${scenarioContext.status}`,
    "",
    "AI INSTRUCTIONS:",
    "Explain what the supplied evidence supports.",
    "Distinguish observed information from assumptions and estimates.",
    "Do not claim an appliance was left on unless sufficient evidence supports that conclusion.",
    "Do not invent energy readings, durations, or savings.",
    "Suggest practical next steps when evidence is incomplete."
  ].join("\n");
}

export default createScenarioContext;
