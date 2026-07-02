import os from "os";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./config/database";

const app = createApp();

// Reads this machine's LAN-reachable IPv4 addresses at runtime so the
// startup log can point developers to a real, working URL instead of
// "localhost" (which only resolves to the device running the server).
const getLanAddresses = (): string[] => {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }

  return addresses;
};

// Connect to MongoDB before accepting HTTP traffic.
// process.exit(1) is called if the DB is unreachable so the orchestrator
// (Docker, PM2, k8s) can restart the container rather than serving 500s.
const startServer = async (): Promise<void> => {
  await connectDatabase();

  const server = app.listen(env.port, env.host, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on: http://localhost:${env.port}`);

    // Only relevant when bound to all interfaces; a deliberately restricted
    // HOST (e.g. 127.0.0.1) means LAN access isn't expected.
    if (env.host === "0.0.0.0") {
      const lanAddresses = getLanAddresses();
      lanAddresses.forEach((address) => {
        // eslint-disable-next-line no-console
        console.log(`LAN: http://${address}:${env.port}`);
      });
      // eslint-disable-next-line no-console
      console.log(`Android emulator: http://10.0.2.2:${env.port}`);
    }

    // eslint-disable-next-line no-console
    console.log(`Environment: ${env.nodeEnv}`);
  });

  // Fail fast and visibly on unhandled issues instead of running in a broken state.
  process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled Rejection:", reason);
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (error) => {
    // eslint-disable-next-line no-console
    console.error("Uncaught Exception:", error);
    server.close(() => process.exit(1));
  });
};

startServer().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error("Server failed to start:", error);
  process.exit(1);
});
