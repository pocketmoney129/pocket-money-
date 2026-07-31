import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "gy6vwzwj",
    api_key: process.env.CLOUDINARY_API_KEY || "218812821379284",
    api_secret: process.env.CLOUDINARY_API_SECRET || "soQnF3wEKiSQpxqBY2rgIx4Oy48"
  });
};

configureCloudinary();

export const uploadToCloudinary = async (fileOrPath: any, folder = "pocket_money"): Promise<string> => {
  try {
    configureCloudinary();

    if (!fileOrPath) return "";

    // 1. Express.Multer.File object with memory buffer
    if (typeof fileOrPath === "object" && fileOrPath.buffer) {
      const mime = fileOrPath.mimetype || "image/jpeg";
      const base64Data = fileOrPath.buffer.toString("base64");
      const dataUri = `data:${mime};base64,${base64Data}`;

      try {
        const result = await cloudinary.uploader.upload(dataUri, {
          folder,
          resource_type: "auto"
        });
        if (result && result.secure_url) {
          return result.secure_url;
        }
      } catch (err: any) {
        console.error("Cloudinary upload error, using dataUri fallback:", err?.message || err);
      }
      return dataUri;
    }

    // 2. Object with file path from disk
    if (typeof fileOrPath === "object" && fileOrPath.path) {
      try {
        const result = await cloudinary.uploader.upload(fileOrPath.path, {
          folder,
          resource_type: "auto"
        });
        if (fs.existsSync(fileOrPath.path)) {
          fs.unlink(fileOrPath.path, () => {});
        }
        if (result && result.secure_url) return result.secure_url;
      } catch (err: any) {
        console.error("Cloudinary path upload error:", err?.message || err);
      }
    }

    // 3. Direct path string
    if (typeof fileOrPath === "string") {
      if (fileOrPath.startsWith("http") || fileOrPath.startsWith("data:")) {
        return fileOrPath;
      }
      try {
        const result = await cloudinary.uploader.upload(fileOrPath, {
          folder,
          resource_type: "auto"
        });
        if (fs.existsSync(fileOrPath)) {
          fs.unlink(fileOrPath, () => {});
        }
        if (result && result.secure_url) return result.secure_url;
      } catch (err: any) {
        console.error("Cloudinary string upload error:", err?.message || err);
      }
    }

    return "";
  } catch (error: any) {
    console.error("Cloudinary Upload Outer Error:", error);
    return "";
  }
};

export default cloudinary;
