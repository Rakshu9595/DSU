import express from "express";
import dotenv from "dotenv";
import { generateAIResponse } from "./genai/services/llm.service.js"; 
dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post("/api/genai/test", async (req, res) => {
  try {
    const { prompt } = req.body;
    const answer = await generateAIResponse(prompt);

    res.json({
      success: true,
      answer
    });
  } catch (error) {
    console.error("GenAI test failed:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});