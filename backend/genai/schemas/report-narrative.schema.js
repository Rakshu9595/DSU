const reportNarrativeSchema = {
  type: "object",

  properties: {
    title: {
      type: "string",
      description: "Title of the energy analysis report."
    },

    executive_summary: {
      type: "string",
      description:
        "Short summary of the supplied energy analysis data."
    },

    energy_analysis: {
      type: "string",
      description:
        "Explanation of the supplied energy consumption estimates."
    },

    key_findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          finding: {
            type: "string",
            description: "A finding supported by the supplied data."
          },

          explanation: {
            type: "string",
            description: "Why this finding matters."
          },

          impact: {
            type: "string",
            enum: ["low", "medium", "high", "unknown"],
            description: "Qualitative impact of this finding."
          }
        },

        required: ["finding", "explanation", "impact"],
        additionalProperties: false
      }
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
            description: "A practical energy-saving action."
          },

          reason: {
            type: "string",
            description: "Explanation based on the supplied data."
          },

          priority: {
            type: "string",
            enum: ["low", "medium", "high"]
          },

          estimated_saving_kwh_month: {
            type: ["number", "null"],
            description:
              "Estimated monthly energy savings in kWh, or null when unsupported."
          }
        },

        required: [
          "title",
          "action",
          "reason",
          "priority",
          "estimated_saving_kwh_month"
        ],

        additionalProperties: false
      }
    },

    sustainability_summary: {
      type: "string",
      description:
        "Summary of the potential environmental benefits, without unsupported claims."
    },

    emissions_estimate: {
      type: ["object", "null"],
      properties: {
        estimated_co2_kg_month: {
          type: ["number", "null"],
          description:
            "Estimated monthly CO2 emissions in kg, or null if the required data is unavailable."
        },

        emission_factor_kg_per_kwh: {
          type: ["number", "null"],
          description:
            "Emission factor used by the backend, in kg CO2 per kWh."
        },

        source: {
          type: "string",
          description:
            "Source of the emission factor, or an explanation that it is unavailable."
        }
      },

      required: [
        "estimated_co2_kg_month",
        "emission_factor_kg_per_kwh",
        "source"
      ],

      additionalProperties: false
    },

    limitations: {
      type: "array",
      items: {
        type: "string"
      },
      description:
        "Assumptions, missing information, and limitations of the analysis."
    },

    disclaimer: {
      type: "string",
      description:
        "Clarifies that estimates are not verified real-time measurements."
    },

    generated_at: {
      type: ["string", "null"],
      description:
        "ISO 8601 timestamp supplied by the backend, or null if unavailable."
    }
  },

  required: [
    "title",
    "executive_summary",
    "energy_analysis",
    "key_findings",
    "recommendations",
    "sustainability_summary",
    "emissions_estimate",
    "limitations",
    "disclaimer",
    "generated_at"
  ],

  additionalProperties: false
};

module.exports = reportNarrativeSchema;
