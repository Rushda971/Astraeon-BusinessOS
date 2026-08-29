import { Prisma } from "@prisma/client";

// JSON response for routes that do not exist.
export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route ${req.method} ${req.originalUrl} was not found.`);
  error.statusCode = 404;
  next(error);
};

// Centralized error translation prevents leaking stack traces or database details.
export const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error.";

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    statusCode = 409;
    message = "A record with this value already exists.";
  }

  if (error instanceof SyntaxError && "body" in error) {
    statusCode = 400;
    message = "Malformed JSON request body.";
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && statusCode !== 503 ? "Internal server error." : message,
  });
};
