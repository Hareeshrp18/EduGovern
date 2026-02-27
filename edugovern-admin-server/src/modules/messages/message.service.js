import * as messageModel from './message.model.js';

/**
 * Message Service - Business logic for message operations
 */

/**
 * Get all messages for admin
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} List of messages
 */
export const getAllMessages = async (filters = {}) => {
  try {
    return await messageModel.findAllForAdmin(filters);
  } catch (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
};

/**
 * Get message by ID
 * @param {number} id - Message ID
 * @returns {Promise<Object>} Message data
 */
export const getMessageById = async (id) => {
  try {
    const message = await messageModel.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }
    return message;
  } catch (error) {
    throw new Error(`Failed to fetch message: ${error.message}`);
  }
};

/**
 * Create a new message (reply)
 * @param {Object} messageData - Message data
 * @returns {Promise<Object>} Created message
 */
export const createMessage = async (messageData) => {
  try {
    // Validate base fields
    if (!messageData.message) {
      throw new Error('Message content is required');
    }

    // Reply flow
    if (messageData.reply_to) {
      const originalMessage = await messageModel.findById(messageData.reply_to);
      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      const replyData = {
        sender_id: 'admin',
        sender_name: 'Admin',
        sender_type: 'other',
        recipient_id: originalMessage.sender_id,
        recipient_name: originalMessage.sender_name,
        recipient_type: originalMessage.sender_type,
        subject: originalMessage.subject ? `Re: ${originalMessage.subject}` : 'Re: Your Message',
        message: messageData.message,
        // Attachments (if present)
        attachment_path: messageData.attachment_path || null,
        attachment_type: messageData.attachment_type || null,
        attachment_name: messageData.attachment_name || null,
        attachment_size: messageData.attachment_size || null
      };

      return await messageModel.create(replyData);
    }

    // New message from admin to a specific recipient
    if (!messageData.recipient_id || !messageData.recipient_type) {
      throw new Error('Recipient ID and recipient type are required for new messages');
    }

    const newMessageData = {
      sender_id: 'admin',
      sender_name: 'Admin',
      sender_type: 'other',
      recipient_id: messageData.recipient_id,
      recipient_name: messageData.recipient_name || 'User',
      recipient_type: messageData.recipient_type,
      subject: messageData.subject || null,
      message: messageData.message,
      // Attachments (if present)
      attachment_path: messageData.attachment_path || null,
      attachment_type: messageData.attachment_type || null,
      attachment_name: messageData.attachment_name || null,
      attachment_size: messageData.attachment_size || null
    };

    return await messageModel.create(newMessageData);
  } catch (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }
};

/**
 * Mark message as read
 * @param {number} id - Message ID
 * @returns {Promise<Object>} Updated message
 */
export const markMessageAsRead = async (id) => {
  try {
    const message = await messageModel.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }
    return await messageModel.markAsRead(id);
  } catch (error) {
    throw new Error(`Failed to mark message as read: ${error.message}`);
  }
};

/**
 * Mark multiple messages as read
 * @param {Array<number>} ids - Array of message IDs
 * @returns {Promise<boolean>} Success status
 */
export const markMessagesAsRead = async (ids) => {
  try {
    return await messageModel.markMultipleAsRead(ids);
  } catch (error) {
    throw new Error(`Failed to mark messages as read: ${error.message}`);
  }
};

/**
 * Delete message
 * @param {number} id - Message ID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (id) => {
  try {
    const message = await messageModel.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }
    await messageModel.remove(id);
  } catch (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
};

/**
 * Get unread message count
 * @returns {Promise<number>} Count of unread messages
 */
export const getUnreadCount = async () => {
  try {
    return await messageModel.getUnreadCount();
  } catch (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }
};
