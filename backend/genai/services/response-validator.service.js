
import chatbotResponseSchema from "../schemas/chatbot-response.schema.js";

function validateChatbotResponse(response) {
  if (!response || typeof response !== "object") {
    return {
      valid: false,
      errors: ["Response must be an object."]
    };
  }

  const errors = [];

  const requiredFields = chatbotResponseSchema.required;

  for (const field of requiredFields) {
    if (!(field in response)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (typeof response.success !== "boolean") {
    errors.push("success must be a boolean.");
  }

  if (typeof response.message !== "string") {
    errors.push("message must be a string.");
  }

  const validIntents = chatbotResponseSchema.properties.intent.enum;

  if (!validIntents.includes(response.intent)) {
    errors.push("intent is invalid.");
  }

  if (!Array.isArray(response.recommendations)) {
    errors.push("recommendations must be an array.");
  } else {
    response.recommendations.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        errors.push(`Recommendation ${index} must be an object.`);
        return;
      }

      if (typeof item.title !== "string") {
        errors.push(`Recommendation ${index}: title must be a string.`);
      }

      if (typeof item.description !== "string") {
        errors.push(`Recommendation ${index}: description must be a string.`);
      }

      if (!["low", "medium", "high"].includes(item.priority)) {
        errors.push(`Recommendation ${index}: priority is invalid.`);
      }

      if (
        item.estimated_saving !== null &&
        (typeof item.estimated_saving !== "number" ||
          !Number.isFinite(item.estimated_saving))
      ) {
        errors.push(
          `Recommendation ${index}: estimated_saving must be a number or null.`
        );
      }

      if (typeof item.reason !== "string") {
        errors.push(`Recommendation ${index}: reason must be a string.`);
      }
    });
  }

  if (
    response.follow_up_question !== null &&
    typeof response.follow_up_question !== "string"
  ) {
    errors.push("follow_up_question must be a string or null.");
  }

  if (typeof response.disclaimer !== "string") {
    errors.push("disclaimer must be a string.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default validateChatbotResponse;
