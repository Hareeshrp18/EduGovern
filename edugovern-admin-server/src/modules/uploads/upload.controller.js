import cloudinary from '../../config/cloudinary.config.js';
import { Readable } from 'stream';

/**
 * Generic upload controller - uploads a single file buffer to Cloudinary
 * Accepts multipart/form-data (field name: 'file')
 * Optional body param: folder (will be used under 'edugovern/')
 */
export const uploadFile = async (req, res) => {
  try {
    // Ensure Cloudinary configured
    const cfg = cloudinary.config ? cloudinary.config() : {};
    if (!cfg || !cfg.api_key || !cfg.api_secret || !cfg.cloud_name) {
      console.error('Cloudinary upload attempted but service is not configured:', cfg);
      return res.status(500).json({ success: false, message: 'Cloudinary is not configured on server' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const folderName = req.body.folder ? `edugovern/${req.body.folder}` : 'edugovern/uploads';
    const resourceType = file.mimetype && file.mimetype.startsWith('image/') ? 'image' : 'raw';

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folderName,
          resource_type: resourceType,
          transformation: resourceType === 'image' ? [{ quality: 'auto' }] : undefined
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        resource_type: uploadResult.resource_type,
        size: file.size,
        name: file.originalname,
        type: file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to upload file' });
  }
};