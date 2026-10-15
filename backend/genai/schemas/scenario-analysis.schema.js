
/**
 * VisionTwin - Scenario Analysis Schema
 *
 * Defines the expected structure for comparing energy scenarios.
 *
 * The backend calculates energy consumption and costs.
 * The AI explains the results in understandable language.
 *
 * This schema does not measure real-time electricity consumption.
 */

const scenarioAnalysisSchema = {
  type: "object",

  properties: {
    title: {
      type: "string",
      description: "Title of the scenario analysis."
    },

    objective: {
      type: "string",
      description: "The energy optimization goal being evaluated."
    },

    baseline: {
      type: "object",
      properties: {
        description: {
          type: "string"
        },

        monthly_energy_kwh: {
          type: ["number", "null"],
          description: "Baseline monthly energy consumption in kWh."
        },

        monthly_cost_inr: {
          type: ["number", "null"],
          description: "Baseline estimated monthly electricity cost in INR."
        },

        data_basis: {
          type: "string",
          enum: [
            "measured",
            "estimated",
            "simulated",
            "unknown"
          ],
          description: "Origin of the baseline values."
        }
      },

      required: [
        "description",
        "monthly_energy_kwh",
        "monthly_cost_inr",
        "data_basis"
      ],

      additionalProperties: false
    },

    scenarios: {
      type: "array",
      description: "Alternative energy-use scenarios for comparison.",

      items: {
        type: "object",

        properties: {
          scenario_id: {
            type: "string"
          },

          name: {
            type: "string",
            description: "Short scenario name."
          },

          description: {
            type: "string",
            description: "What changes in this scenario."
          },

          assumptions: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Assumptions used to calculate the scenario."
          },

          monthly_energy_kwh: {
            type: ["number", "null"],
            description: "Scenario monthly energy consumption in kWh."
          },

          monthly_cost_inr: {
            type: ["number", "null"],
            description: "Scenario estimated monthly cost in INR."
          },

          energy_saved_kwh_month: {
            type: ["number", "null"],
            description:
              "Energy saved compared with baseline, or null if it cannot be calculated."
          },

          cost_saved_inr_month: {
            type: ["number", "null"],
            description:
              "Estimated monthly cost reduction compared with baseline, or null if unknown."
          },

          energy_reduction_percent: {
            type: ["number", "null"],
            description:
              "Percentage energy reduction compared with baseline, or null if unavailable."
          },

          feasibility: {
            type: "string",
            enum: [
              "easy",
              "moderate",
              "difficult",
              "unknown"
            ]
          },

          limitations: {
            type: "array",
            items: {
              type: "string"
            }
          }
        },

        required: [
          "scenario_id",
          "name",
          "description",
          "assumptions",
          "monthly_energy_kwh",
          "monthly_cost_inr",
          "energy_saved_kwh_month",
          "cost_saved_inr_month",
          "energy_reduction_percent",
          "feasibility",
          "limitations"
        ],

        additionalProperties: false
      }
    },

    comparison_summary: {
      type: "string",
      description:
        "Plain-language comparison based on the supplied scenario results."
    },

    recommended_scenario_id: {
      type: ["string", "null"],
      description:
        "ID of a recommended scenario that exists in the scenarios array, or null if no recommendation is justified."
    },

    recommendation_reason: {
      type: "string",
      description:
        "Reason for selecting the recommended scenario."
    },

    simulation_details: {
      type: "object",

      properties: {
        simulation_type: {
          type: "string",
          enum: [
            "usage_reduction",
            "schedule_change",
            "appliance_replacement",
            "combined_changes",
            "custom",
            "unknown"
          ]
        },

        simulation_period_days: {
          type: ["integer", "null"],
          description: "Number of days represented by the simulation."
        },

        electricity_rate_inr_kwh: {
          type: ["number", "null"],
          description: "Electricity rate used in INR per kWh."
        },

        notes: {
          type: "array",
          items: {
            type: "string"
          }
        }
      },

      required: [
        "simulation_type",
        "simulation_period_days",
        "electricity_rate_inr_kwh",
        "notes"
      ],

      additionalProperties: false
    },

    disclaimer: {
      type: "string",
      description:
        "Explains that scenario outcomes depend on assumptions and are not guaranteed savings."
    },

    generated_at: {
      type: ["string", "null"],
      description: "ISO 8601 timestamp supplied by the backend."
    }
  },

  required: [
    "title",
    "objective",
    "baseline",
    "scenarios",
    "comparison_summary",
    "recommended_scenario_id",
    "recommendation_reason",
    "simulation_details",
    "disclaimer",
    "generated_at"
  ],

  additionalProperties: false
};

module.exports = scenarioAnalysisSchema;
