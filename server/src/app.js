import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { createRateLimiter } from "./middleware/rate-limit.middleware.js";

// Load environment variables before creating middleware that depends on them.
dotenv.config();

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(currentDirectory, "../../client/Frontend");
const apiRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 120 });
const authRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 });

// Security and request parsing middleware shared by every route.
app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use("/frontend", express.static(frontendDirectory));

// Lightweight endpoint for deployment and uptime checks.
app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Astraeon Restaurant ERP API is running." });
});

app.use("/api", apiRateLimiter);
app.use("/api/auth", authRateLimiter, authRoutes);
app.use("/api/employees", employeeRoutes);

// Keep these last so unmatched routes and thrown errors get one JSON shape.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
