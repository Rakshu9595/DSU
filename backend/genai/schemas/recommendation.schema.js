
const validateChatbotResponse = require("./chatbot-response-validator.js");

/**
 * VisionTwin Recommendation Service
 *
 * Prepares energy-related context and validates
 * AI-generated recommendations.
 *
 * This service does not measure real electricity usage.
 * It uses the appliance data supplied by your backend.
 */

function buildRecommendationContext(appliances = [], options = {}) {
  if (!Array.isArray(appliances)) {
    throw new TypeError("Appliances must be provided as an array.");
  }

  const electricityRate = Number(options.electricityRate ?? 8);

  if (!Number.isFinite(electricityRate) || electricityRate < 0) {
    throw new TypeError("Electricity rate must be a non-negative number.");
  }

  const normalizedAppliances = appliances.map((appliance, index) => {
    if (!appliance || typeof appliance !== "object") {
      throw new TypeError(`Appliance at index ${index} must be an object.`);
    }

    const wattage =
      appliance.wattage === null || appliance.wattage === undefined
        ? null
        : Number(appliance.wattage);

    const hoursPerDay =
      appliance.hoursPerDay === null || appliance.hoursPerDay === undefined
        ? null
        : Number(appliance.hoursPerDay);

    if (
      wattage !== null &&
      (!Number.isFinite(wattage) || wattage < 0)
    ) {
      throw new TypeError(`Invalid wattage for appliance at index ${index}.`);
    }

    if (
      hoursPerDay !== null &&
      (!Number.isFinite(hoursPerDay) ||
        hoursPerDay < 0 ||
        hoursPerDay > 24)
    ) {
      throw new TypeError(
        `hoursPerDay for appliance at index ${index} must be between 0 and 24.`
      );
    }

    const hasEstimate = wattage !== null && hoursPerDay !== null;

    // Estimated energy consumption, assuming 30 days per month.
    const dailyKwh = hasEstimate
      ? (wattage * hoursPerDay) / 1000
      : null;

    const monthlyKwh = dailyKwh === null ? null : dailyKwh * 30;

    return {
      name: String(appliance.name || `Appliance ${index + 1}`),
      wattage,
      hoursPerDay,
      status: ["on", "off", "unknown"].includes(
        String(appliance.status || "unknown").toLowerCase()
      )
        ? String(appliance.status || "unknown").toLowerCase()
        : "unknown",
      wattageSource: String(appliance.wattageSource || "unspecified"),
      dailyKwh,
      monthlyKwh,
      monthlyCost:
        monthlyKwh === null ? null : monthlyKwh * electricityRate
    };
  });

  const totalMonthlyKwh = normalizedAppliances.reduce(
    (total, appliance) => total + (appliance.monthlyKwh ?? 0),
    0
  );

  const knownEstimateCount = normalizedAppliances.filter(
    (appliance) => appliance.monthlyKwh !== null
  ).length;

  return {
    currency: "INR",
    electricityRate,
    calculationBasis: "Estimated usage over 30 days",
    totalMonthlyKwh,
    totalMonthlyCost: totalMonthlyKwh * electricityRate,
    knownEstimateCount,
    applianceCount: normalizedAppliances.length,
    appliances: normalizedAppliances,
    limitations: [
      "Values are estimates, not live electricity measurements.",
      "Monthly estimates assume 30 days of usage.",
      "Actual consumption depends on appliance operation and usage patterns.",
      "Unknown wattage or operating hours are excluded from energy totals."
    ]
  };
}

/**
 * Validates a structured response from the AI provider.
 * AI provider integration will be connected separately.
 */
function validateRecommendationResponse(response) {
  const result = validateChatbotResponse(response);

  if (!result.valid) {
    const error = new Error("Invalid chatbot response.");
    error.details = result.errors;
    throw error;
  }

  return response;
}

module.exports = {
  buildRecommendationContext,
  validateRecommendationResponse
};
