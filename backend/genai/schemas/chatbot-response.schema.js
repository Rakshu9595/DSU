
/**
 * VisionTwin - Chatbot Response Schema
 *
 * Defines the expected structure of chatbot responses.
 * This schema helps the backend check AI output before
 * sending it to the frontend.
 *
 * Important:
 * - The chatbot provides energy-efficiency guidance.
 * - It must not invent actual sensor readings.
 * - Energy and cost calculations should come from the backend.
 */

const chatbotResponseSchema = {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      description: "Whether the chatbot request was successful."
    },

    message: {
      type: "string",
      description: "The chatbot's user-friendly response."
    },

    intent: {
      type: "string",
      enum: [
        "general_question",
        "energy_analysis",
        "appliance_information",
        "recommendation",
        "digital_twin",
        "sustainability",
        "unknown"
      ],
      description: "The category of the user's request."
    },

    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"]
          },
          estimated_saving: {
            type: ["number", "null"],
            description:
              "Estimated energy savings in kWh per month, or null if unknown."
          },
          reason: {
            type: "string"
          }
        },
        required: [
          "title",
          "description",
          "priority",
          "estimated_saving",
          "reason"
        ],
        additionalProperties: false
      }
    },

    follow_up_question: {
      type: ["string", "null"],
      description:
        "An optional question to clarify the user's request."
    },

    disclaimer: {
      type: "string",
      description:
        "Clarifies when energy values or savings are estimates."
    }
  },

  required: [
    "success",
    "message",
    "intent",
    "recommendations",
    "follow_up_question",
    "disclaimer"
  ],

  additionalProperties: false
};

export default chatbotResponseSchema;
