
function isObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function cleanText(value, fallback = "Not provided") {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return value.trim();
}

function toConfidence(value) {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return null;
  }

  // Accept either 0–1 or percentage-style confidence.
  const normalized = confidence > 1 ? confidence / 100 : confidence;

  if (normalized < 0 || normalized > 1) {
    return null;
  }

  return Number(normalized.toFixed(4));
}

function normalizeDetection(detection, index) {
  if (!isObject(detection)) {
    throw new Error(`Detection at index ${index} must be an object.`);
  }

  return {
    id: cleanText(detection.id, `detection-${index + 1}`),
    label: cleanText(
      detection.label || detection.className || detection.type,
      "Unknown appliance"
    ),
    confidence: toConfidence(detection.confidence),
    status: cleanText(detection.status, "unknown").toLowerCase(),
    location: cleanText(detection.location, "Not identified"),
    source: cleanText(detection.source, "computer-vision"),
    observedAt: cleanText(detection.observedAt, "Not provided")
  };
}

function normalizeDevice(device, index) {
  if (!isObject(device)) {
    throw new Error(`Device at index ${index} must be an object.`);
  }

  const powerWatts =
    device.powerWatts === null ||
    device.powerWatts === undefined ||
    device.powerWatts === ""
      ? null
      : Number(device.powerWatts);

  const dailyUsageHours =
    device.dailyUsageHours === null ||
    device.dailyUsageHours === undefined ||
    device.dailyUsageHours === ""
      ? null
      : Number(device.dailyUsageHours);

  if (
    powerWatts !== null &&
    (!Number.isFinite(powerWatts) || powerWatts < 0)
  ) {
    throw new Error(`Invalid power rating for device ${index + 1}.`);
  }

  if (
    dailyUsageHours !== null &&
    (!Number.isFinite(dailyUsageHours) ||
      dailyUsageHours < 0 ||
      dailyUsageHours > 24)
  ) {
    throw new Error(`Invalid daily usage hours for device ${index + 1}.`);
  }

  return {
    name: cleanText(device.name, "Unknown device"),
    type: cleanText(device.type, "other"),
    status: cleanText(device.status, "unknown").toLowerCase(),
    powerWatts,
    dailyUsageHours,
    source: cleanText(device.source, "user-provided"),
    estimatedDailyEnergyKWh:
      powerWatts !== null && dailyUsageHours !== null
        ? Number(((powerWatts * dailyUsageHours) / 1000).toFixed(3))
        : null
  };
}

/**
 * Builds a traceable evidence package for VisionTwin.
 *
 * Inputs:
 * - detections: computer-vision appliance detection results
 * - devices: appliance information and usage assumptions
 * - energyContext: output from energy-context.service.js
 * - metadata: optional report information
 */
export function buildEvidence({
  detections = [],
  devices = [],
  energyContext = null,
  metadata = {}
} = {}) {
  if (!Array.isArray(detections)) {
    throw new Error("detections must be an array.");
  }

  if (!Array.isArray(devices)) {
    throw new Error("devices must be an array.");
  }

  if (!isObject(metadata)) {
    throw new Error("metadata must be an object.");
  }

  if (energyContext !== null && !isObject(energyContext)) {
    throw new Error("energyContext must be an object or null.");
  }

  const normalizedDetections = detections.map(normalizeDetection);
  const normalizedDevices = devices.map(normalizeDevice);

  const energy = energyContext?.energy || null;

  const evidenceItems = [
    ...normalizedDetections.map((detection) => ({
      category: "appliance_detection",
      claim: `Computer vision detected: ${detection.label}`,
      value: detection,
      evidenceSource: detection.source,
      evidenceType: "model_output",
      confidence: detection.confidence,
      limitation:
        "A visual detection does not prove that the appliance is operating or consuming electricity."
    })),

    ...normalizedDevices.map((device) => ({
      category: "device_context",
      claim: `Device information for ${device.name}`,
      value: device,
      evidenceSource: device.source,
      evidenceType: "provided_or_assumed_input",
      confidence: null,
      limitation:
        "Power ratings and usage hours may be supplied values or estimates; they are not independently verified."
    }))
  ];

  if (energy) {
    evidenceItems.push({
      category: "energy_estimate",
      claim: "Estimated energy consumption and related metrics",
      value: energy,
      evidenceSource: "energy-context.service.js",
      evidenceType: "calculated_estimate",
      confidence: null,
      limitation:
        "Calculated estimates are not real-time meter readings. Accuracy depends on the supplied power ratings and usage hours."
    });
  }

  const missingInformation = [];

  if (normalizedDetections.length === 0) {
    missingInformation.push(
      "No computer-vision detection results were supplied."
    );
  }

  if (normalizedDevices.length === 0) {
    missingInformation.push(
      "No appliance power ratings or usage information were supplied."
    );
  }

  if (
    normalizedDevices.some(
      (device) =>
        device.powerWatts === null ||
        device.dailyUsageHours === null
    )
  ) {
    missingInformation.push(
      "Some devices lack power ratings or daily usage hours, so their energy estimates are unavailable."
    );
  }

  if (!energy) {
    missingInformation.push(
      "No energy-context summary was supplied."
    );
  }

  if (
    normalizedDetections.some(
      (detection) => detection.confidence === null
    )
  ) {
    missingInformation.push(
      "Some detections do not have a valid confidence score."
    );
  }

  return {
    report: {
      title: cleanText(metadata.title, "VisionTwin Energy Evidence Report"),
      reportId: cleanText(metadata.reportId, `evidence-${Date.now()}`),
      generatedAt: new Date().toISOString(),
      location: cleanText(metadata.location),
      reportingPeriod: cleanText(metadata.reportingPeriod)
    },

    summary: {
      detectionCount: normalizedDetections.length,
      deviceCount: normalizedDevices.length,
      evidenceItemCount: evidenceItems.length,
      missingInformationCount: missingInformation.length
    },

    evidence: evidenceItems,

    energySummary: energy
      ? {
          estimatedDailyKWh: energy.estimatedDailyKWh ?? null,
          estimatedPeriodKWh: energy.estimatedPeriodKWh ?? null,
          estimatedCost: energy.estimatedCost ?? null,
          estimatedCarbonKg: energy.estimatedCarbonKg ?? null,
          calculationType: "estimate"
        }
      : null,

    missingInformation,

    limitations: [
      "Computer vision identifies visible appliances; it does not directly measure electrical power.",
      "An appliance's visible switch state may not establish actual electrical consumption.",
      "Energy figures derived from power ratings and usage hours are estimates.",
      "Electricity cost and carbon emissions require appropriate supplied rates or factors.",
      "Recommendations should not claim verified savings without supporting measurements."
    ]
  };
}

/**
 * Converts the evidence package into text for a GenAI prompt.
 */
export function formatEvidenceForAI(evidencePackage) {
  if (!isObject(evidencePackage)) {
    throw new Error("A valid evidence package is required.");
  }

  return [
    "VISIONTWIN EVIDENCE REPORT",
    "",
    `Title: ${evidencePackage.report?.title || "Not provided"}`,
    `Report ID: ${evidencePackage.report?.reportId || "Not provided"}`,
    `Generated at: ${evidencePackage.report?.generatedAt || "Not provided"}`,
    "",
    "SUMMARY",
    JSON.stringify(evidencePackage.summary || {}, null, 2),
    "",
    "EVIDENCE ITEMS",
    JSON.stringify(evidencePackage.evidence || [], null, 2),
    "",
    "ENERGY SUMMARY",
    JSON.stringify(evidencePackage.energySummary, null, 2),
    "",
    "MISSING INFORMATION",
    JSON.stringify(evidencePackage.missingInformation || [], null, 2),
    "",
    "LIMITATIONS",
    JSON.stringify(evidencePackage.limitations || [], null, 2),
    "",
    "INSTRUCTIONS FOR THE AI",
    "Use only the supplied evidence.",
    "Clearly distinguish detections, user-provided values, and calculated estimates.",
    "Do not invent sensor readings or claim that estimated savings have been verified.",
    "If evidence is insufficient, state what additional information is needed."
  ].join("\n");
}

export default buildEvidence;
