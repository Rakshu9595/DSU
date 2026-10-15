
const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export async function generateAIResponse(prompt) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from the backend .env file.");
  }

  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("A non-empty prompt is required.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model:
          process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are VisionTwin, an energy-efficiency assistant. Give practical, safe advice. Never invent sensor readings, measured power consumption, energy savings, or carbon reductions. Clearly label estimates and explain that calculations must be based on supplied data."
          },
          {
            role: "user",
            content: prompt.trim()
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      }),
      signal: controller.signal
    });

    const data = await response.json();

if (!response.ok) {
  console.error("Groq API error details:", data);
  throw new Error(
    `Groq API request failed (${response.status}): ${
      data.error?.message || "Unknown error"
    }`
  );
}

    const answer = data.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("Groq returned an empty response.");
    }

    return answer.trim();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Groq API request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
