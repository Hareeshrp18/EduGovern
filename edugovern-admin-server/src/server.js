import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple paths for .env file
const possiblePaths = [
  join(__dirname, '../.env'),           // Relative to src/
  join(process.cwd(), '.env'),          // Project root using cwd
  resolve(process.cwd(), '.env')        // Absolute path
];

let envPath = null;
let envResult = null;

// Find and load .env file
for (const path of possiblePaths) {
  if (existsSync(path)) {
    envPath = path;
    envResult = dotenv.config({ path: path });
    break;
  }
}

// If no .env found, try default location
if (!envPath) {
  envPath = join(__dirname, '../.env');
  envResult = dotenv.config({ path: envPath });
}

// Debug: Verify .env file loading
if (envResult && envResult.error) {
  console.error('❌ Error loading .env file:', envResult.error.message);
  console.error(`   Tried path: ${envPath}`);
  console.error(`   File exists: ${existsSync(envPath)}`);
  console.error(`   Current working directory: ${process.cwd()}`);
} else {
  console.log('✅ Environment variables loaded from:', envPath || 'default location');
  // Verify critical variables are loaded
  console.log(`   DB_PASSWORD is ${process.env.DB_PASSWORD ? 'SET' : 'NOT SET'}`);
  if (!process.env.DB_PASSWORD) {
    console.warn('⚠️  Warning: DB_PASSWORD is not set in environment variables');
    console.warn('   Please check your .env file exists and contains DB_PASSWORD=root');
  }
}

import app from './app.js';
import { testConnection } from './config/mysql.config.js';
import * as announcementService from './modules/announcements/announcement.service.js';

const PORT = process.env.PORT || 5000;

// Function to check and publish scheduled announcements
const checkAndPublishScheduledAnnouncements = async () => {
  try {
    const publishedCount = await announcementService.publishScheduledAnnouncements();
    if (publishedCount > 0) {
      console.log(`✅ Published ${publishedCount} scheduled announcement(s)`);
    }
  } catch (error) {
    console.error('❌ Error publishing scheduled announcements:', error.message);
  }
};

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Check for scheduled announcements immediately on startup
      checkAndPublishScheduledAnnouncements();
      
      // Check every minute for scheduled announcements that need to be published
      setInterval(checkAndPublishScheduledAnnouncements, 60000); // 60000ms = 1 minute
      console.log('⏰ Scheduled announcement checker started (runs every minute)');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

