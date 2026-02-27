import * as messageService from './message.service.js';
import cloudinary from '../../config/cloudinary.config.js';
import { Readable } from 'stream';

/**
 * Message Controller - Request/response handling for message operations
 */

/**
 * Get all messages for admin
 * GET /api/messages
 */
export const getAllMessages = async (req, res) => {
  try {
    const { sender_type, is_read } = req.query;
    const filters = {};
    
    if (sender_type) filters.sender_type = sender_type;
    if (is_read !== undefined) filters.is_read = is_read === 'true';

    const messages = await messageService.getAllMessages(filters);
    res.status(200).json({
      success: true,
      message: 'Messages fetched successfully',
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages'
    });
  }
};

/**
 * Get message by ID
 * GET /api/messages/:id
 */
export const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await messageService.getMessageById(parseInt(id));
    
    // Mark as read when viewing
    await messageService.markMessageAsRead(parseInt(id));
    
    res.status(200).json({
      success: true,
      message: 'Message fetched successfully',
      data: message
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to fetch message'
    });
  }
};

/**
 * Create a reply message
 * POST /api/messages
 */
export const createMessage = async (req, res) => {
  try {
    const attachment = req.file;
    let attachmentInfo = null;

    if (attachment) {
      // Determine Cloudinary resource type (image vs raw for pdf/doc)
      const resourceType = attachment.mimetype && attachment.mimetype.startsWith('image/') ? 'image' : 'raw';

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'edugovern/messages',
            resource_type: resourceType,
            transformation: resourceType === 'image' ? [{ quality: 'auto' }] : undefined
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        const bufferStream = new Readable();
        bufferStream.push(attachment.buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
      });

      attachmentInfo = {
        attachment_path: uploadResult.secure_url,
        attachment_type: attachment.mimetype,
        attachment_name: attachment.originalname,
        attachment_size: attachment.size
      };
    }

    const messagePayload = {
      ...req.body,
      ...(attachmentInfo || {})
    };

    const message = await messageService.createMessage(messagePayload);
    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: message
    });
  } catch (error) {
    console.error('createMessage error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send reply'
    });
  }
};

/**
 * Mark message as read
 * PUT /api/messages/:id/read
 */
export const markMessageAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await messageService.markMessageAsRead(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to mark message as read'
    });
  }
};

/**
 * Mark multiple messages as read
 * PUT /api/messages/read-multiple
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of message IDs is required'
      });
    }
    await messageService.markMessagesAsRead(ids);
    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to mark messages as read'
    });
  }
};

/**
 * Delete message
 * DELETE /api/messages/:id
 */
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await messageService.deleteMessage(parseInt(id));
    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
};

/**
 * Get unread message count
 * GET /api/messages/unread-count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const count = await messageService.getUnreadCount();
    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count'
    });
  }
};
