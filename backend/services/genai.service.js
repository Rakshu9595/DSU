import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { promptBuilder } from './prompt-builder.service.js';
import { calculateDailyEnergyKwh, calculateMonthlyEnergyKwh, calculateMonthlyCost } from '../utils/energy-math.js';

export class GenAiService {
  constructor() {
    this.provider = env.GENAI_PROVIDER;
    this.apiKey = env.GENAI_API_KEY;
    this.model = env.GENAI_MODEL;
  }

  /**
   * Generates actionable recommendations using external AI provider or internal heuristic engine
   */
  async generateRecommendations(project, devices, energyEstimate, userGoals = []) {
    const { systemPrompt, userPrompt } = promptBuilder.buildRecommendationPrompt(
      project,
      devices,
      energyEstimate,
      userGoals
    );

    // If external Gemini API Key is configured
    if (this.apiKey && (this.provider === 'gemini' || this.provider === 'google')) {
      try {
        const rawAiRecommendations = await this.callGeminiApi(systemPrompt, userPrompt);
        return this.postProcessAndValidate(rawAiRecommendations, devices, energyEstimate, 'gemini');
      } catch (err) {
        logger.warn(`External Gemini API call failed (${err.message}). Falling back to heuristic engine.`);
      }
    }

    // Default: Smart deterministic heuristic advisor
    return this.generateHeuristicRecommendations(project, devices, energyEstimate);
  }

  /**
   * Calls Google Gemini Generative Language API
   */
  async callGeminiApi(systemPrompt, userPrompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model || 'gemini-1.5-flash'}:generateContent?key=${this.apiKey}`;
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Gemini API returned status ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content in Gemini response');
    const parsed = JSON.parse(text);
    return parsed.recommendations || [];
  }

  /**
   * Deterministic rule-based energy advisory engine
   */
  generateHeuristicRecommendations(project, devices, energyEstimate) {
    const recommendations = [];
    const tariff = energyEstimate.tariffApplied || 8.0;

    const appliances = devices.filter((d) => !d.isFitting);

    // 1. High Energy Consumers
    const highConsumers = appliances.filter((d) => d.powerRatingWatts >= 1000);
    highConsumers.forEach((device) => {
      if (device.canonicalName === 'air_conditioner') {
        const reductionHours = 1.5;
        const currentDailyKwh = calculateDailyEnergyKwh(device.powerRatingWatts, device.dailyUsageHours);
        const savedDailyKwh = calculateDailyEnergyKwh(device.powerRatingWatts, reductionHours);
        const monthlySavingsKwh = Number((savedDailyKwh * device.daysUsedPerMonth).toFixed(2));
        const costSavings = calculateMonthlyCost(monthlySavingsKwh, tariff);

        recommendations.push({
          title: `Optimize ${device.displayName} Thermostat & Schedule`,
          description: `Setting your AC to 24°C instead of 18°C-20°C and using a timer to shut off 1.5 hours earlier during cool dawn hours reduces cooling load by up to 24%.`,
          category: 'operating_hours',
          priority: 'high',
          targetDeviceId: device._id,
          targetDeviceName: device.displayName,
          estimatedPotentialSavingsKwh: monthlySavingsKwh,
          estimatedCostSavings: costSavings,
          actionableSteps: [
            'Raise the AC thermostat to a comfortable 24°C.',
            'Activate sleep mode timer so compressor idles before dawn.',
            'Ensure windows and door gaps are sealed to prevent thermal leakage.'
          ],
          supportingEvidence: `Rated at ${device.powerRatingWatts}W for ${device.dailyUsageHours} hrs/day. Reducing 1.5 operating hours/day saves ~${monthlySavingsKwh} kWh/month.`,
          provider: 'heuristic_engine'
        });
      } else if (device.canonicalName === 'water_heater') {
        const savedHours = 0.5;
        const savedDailyKwh = calculateDailyEnergyKwh(device.powerRatingWatts, savedHours);
        const monthlySavingsKwh = Number((savedDailyKwh * device.daysUsedPerMonth).toFixed(2));
        const costSavings = calculateMonthlyCost(monthlySavingsKwh, tariff);

        recommendations.push({
          title: `Limit ${device.displayName} Run Time`,
          description: `Water heaters draw intense continuous wattage (${device.powerRatingWatts}W). Switch off once storage reaches temperature instead of leaving on standby.`,
          category: 'operating_hours',
          priority: 'high',
          targetDeviceId: device._id,
          targetDeviceName: device.displayName,
          estimatedPotentialSavingsKwh: monthlySavingsKwh,
          estimatedCostSavings: costSavings,
          actionableSteps: [
            'Turn on water heater only 20-30 minutes before bathing.',
            'Install a digital timer plug to avoid forgetting it ON.',
            'Descale heating element annually to prevent thermal resistance loss.'
          ],
          supportingEvidence: `Water heater rated at ${device.powerRatingWatts}W consumes significant power rapidly. Saving 30 mins daily saves ${monthlySavingsKwh} kWh/month.`,
          provider: 'heuristic_engine'
        });
      }
    });

    // 2. Ceiling Fans: BLDC Technology Upgrade recommendation
    const fans = appliances.filter((d) => d.canonicalName === 'ceiling_fan');
    fans.forEach((fan) => {
      if (fan.powerRatingWatts >= 60) {
        // Upgrading to 28W BLDC fan
        const savedWatts = fan.powerRatingWatts - 28;
        const savedDailyKwh = calculateDailyEnergyKwh(savedWatts, fan.dailyUsageHours);
        const monthlySavingsKwh = Number((savedDailyKwh * fan.daysUsedPerMonth).toFixed(2));
        const costSavings = calculateMonthlyCost(monthlySavingsKwh, tariff);

        recommendations.push({
          title: `Upgrade ${fan.displayName} to 5-Star BLDC Motor`,
          description: `Conventional induction ceiling fans consume ~75W. Modern BLDC fans consume only 28-35W for equivalent airflow, slashing fan electricity use by >50%.`,
          category: 'energy_efficiency',
          priority: 'medium',
          targetDeviceId: fan._id,
          targetDeviceName: fan.displayName,
          estimatedPotentialSavingsKwh: monthlySavingsKwh,
          estimatedCostSavings: costSavings,
          actionableSteps: [
            'Replace conventional induction motor fan with a BEE 5-Star BLDC fan.',
            'BLDC fans produce less motor heat and operate smoothly on inverters without humming.'
          ],
          supportingEvidence: `Currently estimated at ${fan.powerRatingWatts}W running ${fan.dailyUsageHours} hrs/day. Upgrading to 28W saves ${monthlySavingsKwh} kWh/month.`,
          provider: 'heuristic_engine'
        });
      }
    });

    // 3. General Behavioral & Standby Recommendation
    if (appliances.length > 0 && recommendations.length < 4) {
      recommendations.push({
        title: 'Eliminate Phantom Standby Loads',
        description: 'Entertainment units, TVs, and microwave displays draw 5-15W continuously in standby mode when switched off only by remote.',
        category: 'behavioral',
        priority: 'low',
        targetDeviceId: null,
        targetDeviceName: 'General Room Appliances',
        estimatedPotentialSavingsKwh: 10.0,
        estimatedCostSavings: Number((10.0 * tariff).toFixed(2)),
        actionableSteps: [
          'Switch off appliances at the wall socket when not in use for extended periods.',
          'Use a smart surge protector with master/slave socket auto-cutoff.'
        ],
        supportingEvidence: 'Typical residential households waste 5-10% of total electrical consumption on vampire standby draw.',
        provider: 'heuristic_engine'
      });
    }

    return recommendations;
  }

  /**
   * Post processes AI output and strictly derives numerical savings from backend formulas
   */
  postProcessAndValidate(rawAiRecommendations, devices, energyEstimate, providerName) {
    const tariff = energyEstimate.tariffApplied || 8.0;

    return rawAiRecommendations.map((raw) => {
      const targetDev = devices.find(
        (d) => d.displayName?.toLowerCase() === raw.targetDeviceName?.toLowerCase()
      );

      let savingsKwh = 0;
      let savingsCost = 0;

      if (targetDev && raw.suggestedReductionHours) {
        const dailyKwh = calculateDailyEnergyKwh(targetDev.powerRatingWatts, raw.suggestedReductionHours);
        savingsKwh = Number((dailyKwh * targetDev.daysUsedPerMonth).toFixed(2));
        savingsCost = calculateMonthlyCost(savingsKwh, tariff);
      } else {
        savingsKwh = Number((raw.estimatedPotentialSavingsKwh || 12.0).toFixed(2));
        savingsCost = calculateMonthlyCost(savingsKwh, tariff);
      }

      return {
        title: raw.title || 'Energy Efficiency Advisory',
        description: raw.description || '',
        category: raw.category || 'energy_efficiency',
        priority: raw.priority || 'medium',
        targetDeviceId: targetDev?._id || null,
        targetDeviceName: targetDev?.displayName || raw.targetDeviceName || 'General',
        estimatedPotentialSavingsKwh: savingsKwh,
        estimatedCostSavings: savingsCost,
        actionableSteps: Array.isArray(raw.actionableSteps) ? raw.actionableSteps : [],
        supportingEvidence: raw.supportingEvidence || 'Derived from operating hours and power rating calculation.',
        provider: providerName
      };
    });
  }
}

export const genAiService = new GenAiService();
