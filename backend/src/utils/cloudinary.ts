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

export const uploadBufferToCloudinary = (buffer: Buffer, folder = "pocket_money"): Promise<string> => {
  return new Promise((resolve, reject) => {
    configureCloudinary();
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Stream Upload Error:", error);
          return reject(error);
        }
        if (result && result.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("Cloudinary upload failed: No secure_url returned"));
        }
      }
    );
    uploadStream.end(buffer);
  });
};

export const uploadToCloudinary = async (fileOrPath: any, folder = "pocket_money"): Promise<string> => {
  try {
    configureCloudinary();

    if (!fileOrPath) return "";

    // Express.Multer.File object with memory buffer
    if (typeof fileOrPath === "object" && fileOrPath.buffer) {
      return await uploadBufferToCloudinary(fileOrPath.buffer, folder);
    }

    // Object with file path from disk
    if (typeof fileOrPath === "object" && fileOrPath.path) {
      const result = await cloudinary.uploader.upload(fileOrPath.path, {
        folder,
        resource_type: "auto"
      });
      if (fs.existsSync(fileOrPath.path)) {
        fs.unlink(fileOrPath.path, () => {});
      }
      return result.secure_url;
    }

    // Direct path string
    if (typeof fileOrPath === "string") {
      const result = await cloudinary.uploader.upload(fileOrPath, {
        folder,
        resource_type: "auto"
      });
      if (fs.existsSync(fileOrPath)) {
        fs.unlink(fileOrPath, () => {});
      }
      return result.secure_url;
    }

    return "";
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

export default cloudinary;
