import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import apiRouter from "./routes/index.js"; 
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`🚀 HawkPredict security backend listening on port ${env.port}`);
});