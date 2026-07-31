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

export const uploadToCloudinary = async (filePath: string, folder = "pocket_money"): Promise<string> => {
  try {
    configureCloudinary();
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "auto"
    });

    // Remove local temporary file after successful Cloudinary upload
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, () => {});
    }

    return result.secure_url;
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    return filePath;
  }
};

export default cloudinary;
