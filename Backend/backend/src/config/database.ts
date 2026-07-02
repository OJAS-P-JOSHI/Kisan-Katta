import mongoose from "mongoose";
import { env } from "./env";

// Initializes a single Mongoose connection. Called once at server startup.
// The server must not accept requests until this resolves.
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri);
    // eslint-disable-next-line no-console
    console.log("MongoDB Connected ✅");
    // eslint-disable-next-line no-console
    console.log(`Host: ${mongoose.connection.host}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};
