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

const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 HawkPredict security backend listening on port ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(
        `Port ${port} is already in use. Retrying on port ${port + 1}...`,
      );
      startServer(port + 1);
      return;
    }

    console.error(error);
    process.exit(1);
  });
};

startServer(env.port);
