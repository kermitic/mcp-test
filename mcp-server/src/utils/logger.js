export const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  error: (message, error) => {
    if (error) {
      console.error(`[ERROR] ${message}`, error);
      if (error.stack) {
        console.error(`[ERROR] Stack:`, error.stack);
      }
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    console.log(`[DEBUG] ${message}`, ...args);
  },
};
