const {
  guardAIResponse
} = require("./genai/services/hallucination-guard.service");

const result = guardAIResponse({
  response:
    "The fan consumes 0.9 kWh per day and is guaranteed to save 50%.",

  trustedContext: {
    device: {
      name: "Ceiling Fan",
      powerWatts: 75
    },
    energy: {
      dailyKWh: 0.9
    }
  },

  strictMode: true
});

console.log(JSON.stringify(result, null, 2));