import app from "./app.js";
import prisma from "./config/prisma.js";

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => {
  console.log(`Astraeon Restaurant ERP API listening on port ${port}`);
});

// Close Prisma before Node exits, allowing in-flight database work to finish cleanly.
const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
