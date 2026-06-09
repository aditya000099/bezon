import api from "../lib/api";
import { API_ENDPOINTS } from "../config/api.config";

// Utility to gather extensive browser info
const getBrowserContext = () => {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: (navigator as any).platform || "Unknown",
    windowSize: `${window.innerWidth}x${window.innerHeight}`,
    screenSize: `${window.screen.width}x${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio,
    url: window.location.href,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };
};

export const logger = {
  info: (...args: any[]) => {
    console.info("[Bezon Info]", ...args);
  },
  warn: (...args: any[]) => {
    console.warn("[Bezon Warn]", ...args);
  },
  error: async (...args: any[]) => {
    // Log to console first so it's not hidden locally
    console.error("[Bezon Client Error]", ...args);

    let message = "";
    let stack = "";
    let componentStack = undefined;

    for (const arg of args) {
      if (arg instanceof Error) {
        message += (message ? " " : "") + arg.message;
        if (!stack) stack = arg.stack || "";
      } else if (typeof arg === "string") {
        // Simple heuristic for React component stacks
        if (arg.trim().startsWith("in ") || arg.includes("\n    in ")) {
          componentStack = arg;
        } else {
          message += (message ? " " : "") + arg;
        }
      } else {
        try {
          message += (message ? " " : "") + JSON.stringify(arg);
        } catch (e) {
          logger.error(e);
          message += (message ? " " : "") + String(arg);
        }
      }
    }

    if (!stack) {
      stack = new Error().stack || "";
    }

    // Prepare robust payload
    let userId = "unauthenticated";
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Attempt to decode a JWT safely to extract user ID if present
        const payloadStr = atob(token.split(".")[1]);
        const payload = JSON.parse(payloadStr);
        userId = payload.id || "unauthenticated";
      }
    } catch (e) {
      // Ignore token decode errors
      logger.error(e);
    }

    const payload = {
      message,
      stack,
      componentStack,
      user: userId,
      ...getBrowserContext(),
    };

    // Send silently to server
    try {
      await api.post(API_ENDPOINTS.logs.clientError, payload);
    } catch (apiError) {
      // Failsafe so logging doesn't recursively loop or crash
      console.warn("Failed to send client error log to server", apiError);
    }
  },
};
