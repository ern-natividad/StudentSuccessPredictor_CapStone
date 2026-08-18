import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundHandler, HttpError } from "./middleware/errorHandler.js";
import { formatGeminiHistory } from "./utils/geminiChat.js";

const app = express();

// Initialize Gemini AI Client
const genAI = new GoogleGenerativeAI(env.geminiApiKey || process.env.GEMINI_API_KEY);

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

// Health Check Route
app.get("/health", (req, res) => res.json({ status: "ok" }));

// AI Academic Advising Endpoint
app.post("/api/v1/advising/chat", async (req, res, next) => {
  try {
    const { message, history, studentSnapshot } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message query is required." });
    }

    const systemInstruction = `
      You are an expert AI Academic Advisor for college engineering students.
      Provide structured, actionable, and encouraging academic guidance.

      CURRENT STUDENT SNAPSHOT:
      - Risk Level: ${studentSnapshot?.riskLevel || "Medium"}
      - Key Focus Areas: ${studentSnapshot?.focusAreas || "Attendance & Core Subjects"}

      Guidelines:
      1. Keep responses clear, concise, and structured (use bullet points where appropriate).
      2. Tailor suggestions to the student's risk level and focus areas.
      3. Encourage contacting their assigned human Academic Adviser for formal decisions.
    `;

    const model = genAI.getGenerativeModel({
      model: env.geminiModel,
      systemInstruction: systemInstruction,
    });

    const formattedHistory = formatGeminiHistory(history);

    const chat = model.startChat({
      history: formattedHistory,
    });
    const result = await chat.sendMessage(message);
    const replyText = result.response.text();

    return res.status(200).json({
      success: true,
      reply: replyText,
    });
  } catch (error) {
    console.error("Gemini AI Advising Error:", error);

    if (error?.message?.includes("GoogleGenerativeAI")) {
      return next(
        new HttpError(
          502,
          "The AI advising service is temporarily unavailable. Please try again shortly.",
        ),
      );
    }

    return next(error);
  }
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

// Always bind to PORT from backend/.env (default 5001). Do not auto-switch ports.
const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`🚀 HawkPredict backend listening on port ${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other backend process, then run npm start again.`,
    );
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});