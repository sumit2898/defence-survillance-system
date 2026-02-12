import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import helmet from "helmet";
import compression from "compression";

const app = express();
const httpServer = createServer(app);

console.log("🚀 Server Starting...");
console.log("Environment:", process.env.NODE_ENV);
console.log("Current Directory:", process.cwd());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Security & Performance
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development/flexibility with external sources
}));
app.use(compression());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});



// Export the app for Vercel
export default app;

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  (async () => {
    const { setupWebSocket } = await import("./websocket");
    setupWebSocket(httpServer);

    await registerRoutes(httpServer, app);

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    const isProduction = process.env.NODE_ENV === "production" || process.env.NODE_ENV === undefined;
    console.log("Checking Environment Logic...", { isProduction, env: process.env.NODE_ENV });

    if (isProduction) {
      console.log("✅ Entering Production Mode (Default)");
      serveStatic(app);
    } else {
      console.log("⚠️ Entering Development Mode - Attempting SetupVite");
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
    // Refresh Dashboard Stats every 5 minutes
    setInterval(async () => {
      try {
        const { refreshDashboardStats } = await import("./storage");
        await refreshDashboardStats();
        log("Dashboard stats refreshed");
      } catch (e) {
        console.error("Failed to auto-refresh dashboard stats:", e);
      }
    }, 5 * 60 * 1000);

  })();
}
