import fs from "fs";
import path from "path";

const logFile = path.join(process.cwd(), "fyers.log");

function formatTimestamp(date = new Date()) {
  return date
    .toISOString()
    .replace("en-IN", { hour12: false })
    .replace(",", "");
}

function writeLog(level, message) {
  const timestamp = formatTimestamp();
  const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}\n`;

  fs.appendFile(logFile, logLine, (err) => {
    if (err) {
      console.error(`[${timestamp}] Failed to write log: ${err.message}`);
    }
  });

  const colors = {
    INFO: "\x1b[36m", 
    WARN: "\x1b[33m", 
    ERROR: "\x1b[31m",
    DEBUG: "\x1b[35m",
  };
  console.log(`${colors[level.toUpperCase()] || ""}${logLine}\x1b[0m`);
}

export function logInfo(message) {
  writeLog("INFO", message);
}

export function logWarn(message) {
  writeLog("WARN", message);
}

export function logError(error, label = "ERROR") {
  const msg = error?.stack || error?.message || error;
  writeLog(label, msg);
}

export function logDebug(message) {
  writeLog("DEBUG", message);
}
