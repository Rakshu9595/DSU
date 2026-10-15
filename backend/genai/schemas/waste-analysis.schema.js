
/**
 * VisionTwin - Energy Waste Analysis Schema
 *
 * Defines the structure of energy-waste analysis results.
 *
 * The backend calculates energy consumption and estimated waste.
 * The AI explains the findings and suggests corrective actions.
 *
 * This schema does not measure actual electricity consumption.
 */

const wasteAnalysisSchema = {
  type: "object",

  properties: {
    title: {
      type: "string",
      description: "Title of the energy-waste analysis."
    },

    executive_summary: {
      type: "string",
      description:
        "A concise summary based on the supplied appliance and energy data."
    },

    analysis_basis: {
      type: "string",
      enum: [
        "video_observation",
        "user_provided_data",
        "estimated_usage",
        "simulated_data",
        "combined",
        "unknown"
      ],
      description: "The evidence used to conduct the analysis."
    },

    observations: {
      type: "array",
      items: {
        type: "object",

        properties: {
          appliance_name: {
            type: "string"
          },

          observation: {
            type: "string",
            description:
              "What was observed or supplied as input."
          },

          observation_source: {
            type: "string",
            enum: [
              "computer_vision",
              "user_input",
              "backend_calculation",
              "simulation",
              "unknown"
            ]
          },

          confidence: {
            type: ["number", "null"],
            description:
              "Confidence score from 0 to 1 if supplied by the detection system."
          },

          potential_waste: {
            type: "string",
            enum: [
              "possible",
              "likely",
              "not_identified",
              "unknown"
            ],
            description:
              "Indicates whether the available evidence suggests potential energy waste."
          },

          evidence: {
            type: "string",
            description:
              "Evidence or assumptions supporting the observation."
          }
        },

        required: [
          "appliance_name",
          "observation",
          "observation_source",
          "confidence",
          "potential_waste",
          "evidence"
        ],

        additionalProperties: false
      }
    },

    estimated_waste: {
      type: "object",

      properties: {
        daily_energy_kwh: {
          type: ["number", "null"],
          description:
            "Estimated potentially wasted energy per day, in kWh."
        },

        monthly_energy_kwh: {
          type: ["number", "null"],
          description:
            "Estimated potentially wasted energy over 30 days, in kWh."
        },

        daily_cost_inr: {
          type: ["number", "null"],
          description:
            "Estimated daily electricity cost associated with the potential waste."
        },

        monthly_cost_inr: {
          type: ["number", "null"],
          description:
            "Estimated monthly electricity cost associated with the potential waste."
        },

        calculation_basis: {
          type: "string",
          description:
            "Formula, input values, and assumptions used by the backend."
        },

        estimate_status: {
          type: "string",
          enum: [
            "calculated",
            "partial_data",
            "insufficient_data"
          ]
        }
      },

      required: [
        "daily_energy_kwh",
        "monthly_energy_kwh",
        "daily_cost_inr",
        "monthly_cost_inr",
        "calculation_basis",
        "estimate_status"
      ],

      additionalProperties: false
    },

    recommendations: {
      type: "array",

      items: {
        type: "object",

        properties: {
          title: {
            type: "string"
          },

          action: {
            type: "string",
            description:
              "A practical action to reduce potential energy waste."
          },

          reason: {
            type: "string",
            description:
              "Why the action may help, based on the available evidence."
          },

          priority: {
            type: "string",
            enum: ["low", "medium", "high"]
          },

          expected_result: {
            type: "string",
            description:
              "Expected qualitative outcome without unsupported savings claims."
          },

          estimated_saving_kwh_month: {
            type: ["number", "null"],
            description:
              "Estimated monthly energy savings calculated by the backend, or null if unknown."
          }
        },

        required: [
          "title",
          "action",
          "reason",
          "priority",
          "expected_result",
          "estimated_saving_kwh_month"
        ],

        additionalProperties: false
      }
    },

    data_gaps: {
      type: "array",
      items: {
        type: "string"
      },
      description:
        "Missing information needed to make the analysis more reliable."
    },

    limitations: {
      type: "array",
      items: {
        type: "string"
      },
      description:
        "Assumptions and limitations of the analysis."
    },

    disclaimer: {
      type: "string",
      description:
        "Clarifies that potential waste and savings are estimates, not verified measurements."
    },

    generated_at: {
      type: ["string", "null"],
      description:
        "ISO 8601 timestamp supplied by the backend."
    }
  },

  required: [
    "title",
    "executive_summary",
    "analysis_basis",
    "observations",
    "estimated_waste",
    "recommendations",
    "data_gaps",
    "limitations",
    "disclaimer",
    "generated_at"
  ],

  additionalProperties: false
};

module.exports = wasteAnalysisSchema;
