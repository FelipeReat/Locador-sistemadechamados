import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";
import simpleRoutes from './simple-routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple logging middleware
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

// Routes
app.use(simpleRoutes);

(async () => {
  const server = app.listen(5000, "0.0.0.0", () => {
    log(`serving on port 5000`);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // setup vite in dev and static assets in prod
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  // Create admin user for testing
  try {
    const { storage } = await import('./simple-storage');
    const adminExists = await storage.getUserByEmail('admin@servicedesk.com');

    if (!adminExists) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.default.hash('admin123', 10);

      await storage.createUser({
        email: 'admin@servicedesk.com',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN'
      });

      log('Admin user created: admin@servicedesk.com / admin123');
    }
  } catch (error) {
    log('Database not yet available for seeding admin user');
  }
})();