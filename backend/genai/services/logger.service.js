
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const configuredLevel = (
  process.env.LOG_LEVEL || "INFO"
).toUpperCase();

const MIN_LOG_LEVEL =
  LOG_LEVELS[configuredLevel] ?? LOG_LEVELS.INFO;

function writeLog(level, message, metadata = {}) {
  if (LOG_LEVELS[level] < MIN_LOG_LEVEL) {
    return;
  }

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: "VisionTwin",
    message:
      typeof message === "string"
        ? message
        : String(message),
    ...(metadata && typeof metadata === "object"
      ? { metadata }
      : {})
  };

  const output = JSON.stringify(entry);

  if (level === "ERROR") {
    console.error(output);
  } else if (level === "WARN") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug(message, metadata) {
    writeLog("DEBUG", message, metadata);
  },

  info(message, metadata) {
    writeLog("INFO", message, metadata);
  },

  warn(message, metadata) {
    writeLog("WARN", message, metadata);
  },

  error(message, metadata) {
    writeLog("ERROR", message, metadata);
  }
};

export default logger;
