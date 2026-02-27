import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || undefined;
const apiKey = process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY || undefined;
const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUD_API_SECRET || undefined;

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true
});

export const isCloudinaryConfigured = () => {
  return !!(cloudName && apiKey && apiSecret);
};

if (!isCloudinaryConfigured()) {
  console.warn(' Cloudinary credentials are not fully configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env (or use legacy names CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET)');
  console.warn(` Current values: CLOUDINARY_CLOUD_NAME=${!!process.env.CLOUDINARY_CLOUD_NAME}, CLOUD_NAME=${!!process.env.CLOUD_NAME}`);
} else {
  console.log(' Cloudinary configured (using environment variables)');
}

export default cloudinary;
