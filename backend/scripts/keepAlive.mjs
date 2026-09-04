import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const serverEntry = path.join(backendRoot, "src", "server.js");

const RESTART_DELAY_MS = 1200;
let child = null;
let shuttingDown = false;
let restartTimer = null;

const clearRestartTimer = () => {
  if (!restartTimer) return;
  clearTimeout(restartTimer);
  restartTimer = null;
};

const startServer = () => {
  clearRestartTimer();

  child = spawn(process.execPath, [serverEntry], {
    cwd: backendRoot,
    env: process.env,
    stdio: "inherit",
  });

  console.log(`[keep-alive] Backend started (pid ${child.pid}).`);

  child.on("exit", (code, signal) => {
    child = null;
    if (shuttingDown) {
      process.exit(code ?? 0);
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code}`;
    console.error(
      `[keep-alive] Backend stopped (${reason}). Restarting in ${RESTART_DELAY_MS}ms...`,
    );
    restartTimer = setTimeout(startServer, RESTART_DELAY_MS);
  });
};

const stopGracefully = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  clearRestartTimer();
  console.log("[keep-alive] Shutting down...");
  if (child && !child.killed) {
    child.kill("SIGTERM");
    setTimeout(() => {
      if (child && !child.killed) child.kill("SIGKILL");
      process.exit(0);
    }, 4000);
    return;
  }
  process.exit(0);
};

process.on("SIGINT", stopGracefully);
process.on("SIGTERM", stopGracefully);

startServer();
