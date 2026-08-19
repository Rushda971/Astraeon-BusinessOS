import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

// Load environment variables before creating middleware that depends on them.
dotenv.config();

const app = express();

// Security and request parsing middleware shared by every route.
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));

// Lightweight endpoint for deployment and uptime checks.
app.get("/", (_req, res) => {
  res.status(200).json({ success: true, message: "Astraeon Restaurant ERP API is running." });
});

app.use("/api/auth", authRoutes);

// Keep these last so unmatched routes and thrown errors get one JSON shape.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
