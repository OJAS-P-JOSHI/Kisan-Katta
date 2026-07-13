import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";
import { AppError } from "../utils/AppError";

const assertCloudinaryConfigured = (): void => {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new AppError("Cloudinary is not configured on the server.", 500);
  }
};

assertCloudinaryConfigured();

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
  secure: true,
});

export { cloudinary };
