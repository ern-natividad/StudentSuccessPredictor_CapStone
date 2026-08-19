import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundHandler, HttpError } from "./middleware/errorHandler.js";
import { formatGeminiHistory } from "./utils/geminiChat.js";
import { requireAuth, requireRole } from "./middleware/authMiddleware.js";
import { buildAdvisingSystemInstruction } from "./utils/advisingPrompt.js";
import { isGeminiServiceError, resolveAdvisingReply } from "./utils/geminiReply.js";

const app = express();

// Initialize Gemini AI Client
const genAI = new GoogleGenerativeAI(env.geminiApiKey || process.env.GEMINI_API_KEY);

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

// Health Check Route
app.get("/health", (req, res) => res.json({ status: "ok" }));

// AI Academic Advising Endpoint
app.post(
  "/api/v1/advising/chat",
  requireAuth,
  requireRole("admin", "staff", "student"),
  async (req, res, next) => {
  try {
    const { message, history, studentSnapshot } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message query is required." });
    }

    const systemInstruction = buildAdvisingSystemInstruction(
      studentSnapshot || {},
      req.user.role,
    );

    const model = genAI.getGenerativeModel({
      model: env.geminiModel,
      systemInstruction: systemInstruction,
    });

    const formattedHistory = formatGeminiHistory(history);

    const chat = model.startChat({
      history: formattedHistory,
    });
    const result = await chat.sendMessage(message);
    const replyText = resolveAdvisingReply(message, result);

    return res.status(200).json({
      success: true,
      reply: replyText,
    });
  } catch (error) {
    console.error("Gemini AI Advising Error:", error);

    if (isGeminiServiceError(error)) {
      return next(
        new HttpError(
          502,
          "The AI advising service is temporarily unavailable. Please try again shortly.",
        ),
      );
    }

    return res.status(200).json({
      success: true,
      reply:
        "I can't answer that right now. Please ask about your academic plan, grades, or study strategies.",
    });
  }
  },
);

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