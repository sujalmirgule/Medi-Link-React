import app from "./app";
import { env } from "./config/env";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, () => {
  console.log(`[Server] MediLink API Server running in ${env.NODE_ENV} mode`);
  console.log(`[Server] Listening on http://localhost:${env.PORT}`);
  console.log(`[Server] Health check available at http://localhost:${env.PORT}/api/v1/health`);
  console.log(`[Server] CORS configured for frontend at: ${env.FRONTEND_URL}`);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("[Server] HTTP server closed.");
    try {
      await prisma.$disconnect();
      console.log("[Server] Database connection closed.");
    } catch (err) {
      console.error("[Server] Error disconnecting from database:", err);
    }
    process.exit(0);
  });

  // Force shutdown after 10 seconds if not closed gracefully
  setTimeout(() => {
    console.error("[Server] Forcing shutdown after timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
