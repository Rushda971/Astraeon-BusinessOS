import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import salesRoutes from "./routes/sales.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import menuRoutes from "./routes/menu.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { createRateLimiter } from "./middleware/rate-limit.middleware.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
// Resolve the backend environment file from this module, not the shell's cwd.
dotenv.config({ path: path.resolve(currentDirectory, "../.env") });

const app = express();
const frontendDirectory = path.resolve(currentDirectory, "../../client/app/dist");
const apiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 120 });
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });
const configuredCorsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:5000,http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedCorsOrigins = new Set(configuredCorsOrigins);
for (const origin of configuredCorsOrigins) {
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      url.hostname = url.hostname === "localhost" ? "127.0.0.1" : "localhost";
      allowedCorsOrigins.add(url.origin);
    }
  } catch {
    // Ignore malformed optional origins; valid configured origins remain usable.
  }
}

// Security and request parsing middleware shared by every route.
app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedCorsOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use("/frontend", express.static(frontendDirectory));

// Lightweight endpoint for deployment and uptime checks.
app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Astraeon Restaurant ERP API is running." });
});

app.use("/api", apiRateLimiter);
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/menu", menuRoutes);

// Keep these last so unmatched routes and thrown errors get one JSON shape.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
