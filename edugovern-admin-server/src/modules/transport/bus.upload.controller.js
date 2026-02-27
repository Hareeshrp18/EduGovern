import cloudinary from '../../config/cloudinary.config.js';
import { Readable } from 'stream';

/**
 * Upload bus images to Cloudinary
 * POST /api/transport/buses/upload-images
 */
export const uploadBusImages = async (req, res) => {
  try {
    // Check Cloudinary configuration first
    const cfg = cloudinary.config ? cloudinary.config() : {};
    if (!cfg || !cfg.api_key || !cfg.api_secret || !cfg.cloud_name) {
      console.error('Cloudinary not configured:', cfg);
      return res.status(500).json({
        success: false,
        message: 'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the backend .env'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'edugovern/buses',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 800, crop: 'limit', quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              // Include file original name in the error to help debugging
              reject(new Error(`${file.originalname}: ${error.message || error}`));
            } else {
              resolve(result.secure_url);
            }
          }
        );

        // Convert buffer to stream
        const bufferStream = new Readable();
        bufferStream.push(file.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        images: imageUrls
      }
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images'
    });
  }
};
