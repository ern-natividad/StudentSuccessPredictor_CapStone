import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundHandler, HttpError } from "./middleware/errorHandler.js";
import { formatGeminiHistory } from "./utils/geminiChat.js";
import { requireAuth, requireRole } from "./middleware/authMiddleware.js";
import { buildAdvisingSystemInstruction } from "./utils/advisingPrompt.js";
import {
  buildOfflineAdvisingReply,
  resolveAdvisingReply,
  sendAdvisingChatMessage,
} from "./utils/geminiReply.js";

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
  const { message, history, studentSnapshot } = req.body || {};

  try {
    if (!message) {
      return res.status(400).json({ error: "Message query is required." });
    }

    if (!env.geminiApiKey && !process.env.GEMINI_API_KEY) {
      return next(
        new HttpError(
          503,
          "AI advising is not configured. Ask an administrator to set GEMINI_API_KEY.",
        ),
      );
    }

    const systemInstruction = buildAdvisingSystemInstruction(
      studentSnapshot || {},
      req.user.role,
    );

    const formattedHistory = formatGeminiHistory(history);
    const { result, modelName } = await sendAdvisingChatMessage({
      genAI,
      preferredModel: env.geminiModel,
      systemInstruction,
      history: formattedHistory,
      message,
    });
    const replyText = resolveAdvisingReply(message, result);

    return res.status(200).json({
      success: true,
      reply: replyText,
      model: modelName,
    });
  } catch (error) {
    console.error("Gemini AI Advising Error:", error);

    // Never fail the chat UI during demos: return snapshot-based guidance.
    return res.status(200).json({
      success: true,
      offline: true,
      reply: buildOfflineAdvisingReply(
        studentSnapshot || {},
        message,
        req.user?.role || "student",
      ),
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