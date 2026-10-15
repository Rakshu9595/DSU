
require("dotenv").config();

const {
  generateText,
  isLLMConfigured
} = require("./genai/services/llm.service");

async function testLLM() {
  try {
    console.log(
      "Gemini configured:",
      isLLMConfigured()
    );

    const response = await generateText({
      systemPrompt:
        "You are an energy management assistant. " +
        "Explain concepts clearly and accurately.",

      prompt:
        "Explain how to calculate electricity consumption " +
        "for a 75-watt ceiling fan running for 8 hours.",

      temperature: 0.2
    });

    console.log("\nGemini Response:\n");
    console.log(response);

  } catch (error) {
    console.error(
      "LLM test failed:",
      error.code,
      error.message
    );
  }
}

testLLM();
