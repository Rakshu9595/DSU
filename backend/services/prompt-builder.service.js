export class PromptBuilderService {
  /**
   * Constructs a strictly grounded prompt for the GenAI model
   */
  buildRecommendationPrompt(project, devices, energyEstimate, userGoals = []) {
    const applianceList = devices
      .filter((d) => !d.isFitting)
      .map((d) => ({
        id: d._id.toString(),
        name: d.displayName,
        type: d.canonicalName,
        category: d.category,
        powerRatingWatts: d.powerRatingWatts,
        powerRatingSource: d.powerRatingSource,
        isVerifiedRating: d.powerRatingVerified,
        dailyHours: d.dailyUsageHours,
        daysPerMonth: d.daysUsedPerMonth,
        isVariableLoad: d.isVariablePower
      }));

    const systemPrompt = `You are VisionTwin AI, an expert industrial and residential energy optimization advisor.
CRITICAL INTEGRITY INSTRUCTIONS:
1. You MUST NOT invent sensor power measurements. All wattages provided are ratings or reference estimates.
2. You MUST NOT claim appliances are actively running simply because they were detected in video frames.
3. You MUST NOT claim energy savings have been physical measurements; label all savings as calculated potential estimates.
4. Base all guidance on the exact device inventory and operating assumptions provided below.
5. Provide actionable, evidence-based recommendations categorized into: operating_hours, high_consumption, maintenance, energy_efficiency, behavioral.
6. Provide output strictly in JSON format as specified.`;

    const userPrompt = `
PROJECT CONTEXT:
- Name: ${project.name}
- Room Type: ${project.roomType}
- Dimensions: ${project.roomDimensions?.length}m x ${project.roomDimensions?.width}m x ${project.roomDimensions?.height}m
- Tariff: ₹${energyEstimate.tariffApplied}/kWh
- Emission Factor: ${energyEstimate.emissionFactorApplied} kg CO2/kWh
- Monthly Estimated Energy: ${energyEstimate.totalMonthlyEnergyKwh} kWh
- Monthly Estimated Cost: ₹${energyEstimate.totalMonthlyCost}
- Monthly Estimated Carbon: ${energyEstimate.totalCarbonEmissionsKg} kg CO2e
- User Goals: ${userGoals.length > 0 ? userGoals.join(', ') : 'Reduce overall energy waste and electric bills'}

APPLIANCE INVENTORY:
${JSON.stringify(applianceList, null, 2)}

DEVICE BREAKDOWN:
${JSON.stringify(energyEstimate.deviceBreakdown || [], null, 2)}

Respond with a JSON object containing an array of "recommendations":
{
  "recommendations": [
    {
      "title": "Short actionable recommendation title",
      "description": "Clear explanation of the optimization",
      "category": "operating_hours | high_consumption | maintenance | energy_efficiency | behavioral",
      "priority": "high | medium | low",
      "targetDeviceName": "Exact appliance name from inventory if applicable",
      "actionableSteps": [
        "Step 1...",
        "Step 2..."
      ],
      "supportingEvidence": "Explicit mathematical or behavioral reason referencing device wattage and hours",
      "suggestedReductionHours": 1.5
    }
  ]
}`;

    return { systemPrompt, userPrompt };
  }
}

export const promptBuilder = new PromptBuilderService();
