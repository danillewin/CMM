import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import path from "path";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS headers for development
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Enhanced request logging middleware
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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test database connection before starting server
(async () => {
  try {
    log("Starting server initialization...");
    log("Checking DATABASE_URL...");

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Log presence of database environment variables (without exposing values)
    const dbEnvVars = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD', 'PGPORT'];
    const missingVars = dbEnvVars.filter(v => !process.env[v]);
    if (missingVars.length > 0) {
      log(`Warning: Missing database environment variables: ${missingVars.join(', ')}`);
    } else {
      log("All required database environment variables are present");
    }

    log("Testing database connection...");
    try {
      // Test query to verify database connection
      await pool.query('SELECT 1');
      log("Database connection successful");
    } catch (dbError) {
      log(`Database connection test failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      throw dbError;
    }

    log("Setting up routes...");
    const server = registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error: ${message} (${status})`);

      res.status(status).json({ 
        message,
        error: app.get("env") === "development" ? err.stack : undefined 
      });
    });

    // Force production mode temporarily to bypass Vite
    log("Setting up static file serving...");
    serveStatic(app);
    log("Static file serving setup complete");

    // ALWAYS serve the app on port 5000
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server is running on port ${PORT}`);
      log("Environment: production");
    });
  } catch (error) {
    log(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
})();