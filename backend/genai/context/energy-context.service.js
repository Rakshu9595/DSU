
const DEFAULTS = {
  electricityRatePerKWh: null,
  carbonEmissionKgPerKWh: null
};

function toNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`${fieldName} must be a non-negative number.`);
  }

  return number;
}

function round(value, decimals = 3) {
  return Number(value.toFixed(decimals));
}

/**
 * Creates an energy context from device information.
 *
 * All calculations are estimates unless based on actual measured readings.
 * No default electricity rate or emissions factor is assumed.
 */
export function createEnergyContext({
  devices = [],
  electricityRatePerKWh = DEFAULTS.electricityRatePerKWh,
  carbonEmissionKgPerKWh = DEFAULTS.carbonEmissionKgPerKWh,
  periodDays = 1
} = {}) {
  if (!Array.isArray(devices)) {
    throw new Error("devices must be an array.");
  }

  const days = toNonNegativeNumber(periodDays, "periodDays");

  if (days === null || days === 0) {
    throw new Error("periodDays must be greater than zero.");
  }

  const rate = toNonNegativeNumber(
    electricityRatePerKWh,
    "electricityRatePerKWh"
  );

  const emissionFactor = toNonNegativeNumber(
    carbonEmissionKgPerKWh,
    "carbonEmissionKgPerKWh"
  );

  let totalEstimatedDailyKWh = 0;
  let devicesWithEnergyEstimates = 0;

  const processedDevices = devices.map((device) => {
    if (!device || typeof device !== "object" || Array.isArray(device)) {
      throw new Error("Each device must be an object.");
    }

    const powerWatts = toNonNegativeNumber(
      device.powerWatts,
      "device.powerWatts"
    );

    const dailyUsageHours = toNonNegativeNumber(
      device.dailyUsageHours,
      "device.dailyUsageHours"
    );

    if (dailyUsageHours !== null && dailyUsageHours > 24) {
      throw new Error("dailyUsageHours cannot exceed 24.");
    }

    const dailyEnergyKWh =
      powerWatts !== null && dailyUsageHours !== null
        ? (powerWatts * dailyUsageHours) / 1000
        : null;

    const estimatedEnergyForPeriod =
      dailyEnergyKWh !== null ? dailyEnergyKWh * days : null;

    if (dailyEnergyKWh !== null) {
      totalEstimatedDailyKWh += dailyEnergyKWh;
      devicesWithEnergyEstimates += 1;
    }

    return {
      name: device.name || "Unknown device",
      type: device.type || "other",
      status: device.status || "unknown",
      powerWatts,
      dailyUsageHours,
      dailyEnergyKWh:
        dailyEnergyKWh !== null ? round(dailyEnergyKWh) : null,
      estimatedPeriodEnergyKWh:
        estimatedEnergyForPeriod !== null
          ? round(estimatedEnergyForPeriod)
          : null,
      dataSource: device.source || "user-provided",
      calculationType: "estimate"
    };
  });

  const totalEnergyForPeriod = totalEstimatedDailyKWh * days;

  const estimatedCost =
    rate !== null ? totalEnergyForPeriod * rate : null;

  const estimatedCarbonKg =
    emissionFactor !== null
      ? totalEnergyForPeriod * emissionFactor
      : null;

  return {
    periodDays: days,
    deviceCount: processedDevices.length,
    devicesWithEnergyEstimates,
    devicesWithoutEnergyEstimates:
      processedDevices.length - devicesWithEnergyEstimates,

    energy: {
      estimatedDailyKWh: round(totalEstimatedDailyKWh),
      estimatedPeriodKWh: round(totalEnergyForPeriod),
      electricityRatePerKWh: rate,
      estimatedCost:
        estimatedCost !== null ? round(estimatedCost, 2) : null,
      carbonEmissionKgPerKWh: emissionFactor,
      estimatedCarbonKg:
        estimatedCarbonKg !== null ? round(estimatedCarbonKg) : null,
      calculationType: "estimate"
    },

    devices: processedDevices,

    notes: [
      "Energy consumption is estimated from power rating and daily usage hours.",
      "Nameplate power ratings may differ from actual operating power.",
      "Missing device power or usage data is not treated as zero consumption.",
      "Cost is calculated only when an electricity rate is supplied.",
      "Carbon emissions are calculated only when an emissions factor is supplied.",
      "Estimates are not actual meter readings."
    ]
  };
}

/**
 * Formats energy information for use in a GenAI prompt.
 */
export function formatEnergyContext(energyContext) {
  if (!energyContext || typeof energyContext !== "object") {
    throw new Error("A valid energy context is required.");
  }

  return [
    "VISIONTWIN ENERGY CONTEXT",
    "",
    `Period: ${energyContext.periodDays} day(s)`,
    `Devices: ${energyContext.deviceCount}`,
    `Devices with energy estimates: ${energyContext.devicesWithEnergyEstimates}`,
    `Devices missing required energy data: ${energyContext.devicesWithoutEnergyEstimates}`,
    "",
    "ENERGY SUMMARY",
    `Estimated daily consumption: ${energyContext.energy.estimatedDailyKWh} kWh`,
    `Estimated period consumption: ${energyContext.energy.estimatedPeriodKWh} kWh`,
    `Electricity rate: ${
      energyContext.energy.electricityRatePerKWh !== null
        ? `${energyContext.energy.electricityRatePerKWh} currency units/kWh`
        : "Not provided"
    }`,
    `Estimated electricity cost: ${
      energyContext.energy.estimatedCost !== null
        ? energyContext.energy.estimatedCost
        : "Cannot calculate without an electricity rate"
    }`,
    `Carbon emissions factor: ${
      energyContext.energy.carbonEmissionKgPerKWh !== null
        ? `${energyContext.energy.carbonEmissionKgPerKWh} kg CO2e/kWh`
        : "Not provided"
    }`,
    `Estimated carbon emissions: ${
      energyContext.energy.estimatedCarbonKg !== null
        ? `${energyContext.energy.estimatedCarbonKg} kg CO2e`
        : "Cannot calculate without an emissions factor"
    }`,
    "",
    "DEVICE DETAILS",
    ...energyContext.devices.map((device) =>
      [
        `Device: ${device.name}`,
        `Type: ${device.type}`,
        `Status: ${device.status}`,
        `Power: ${device.powerWatts !== null ? `${device.powerWatts} W` : "Unknown"}`,
        `Daily usage: ${device.dailyUsageHours !== null ? `${device.dailyUsageHours} hours` : "Unknown"}`,
        `Estimated daily energy: ${device.dailyEnergyKWh !== null ? `${device.dailyEnergyKWh} kWh` : "Unavailable"}`,
        `Data source: ${device.dataSource}`
      ].join(" | ")
    ),
    "",
    "AI INSTRUCTIONS",
    "Use these values as estimates, not verified measurements.",
    "Do not invent missing readings, electricity rates, or emissions factors.",
    "Give practical energy-saving suggestions based on the available data."
  ].join("\n");
}

export default createEnergyContext;
