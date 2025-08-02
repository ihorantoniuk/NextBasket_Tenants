import { config } from './config';
import { database } from './database';
import { logger } from './middleware/logger';
import { handleUncaughtException, handleUnhandledRejection } from './middleware/errorHandler';
import createApp from './app';

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

async function startServer(): Promise<void> {
  try {
    logger.info('Starting E-commerce Workflow server...');

    // Connect to database
    logger.info('Connecting to database...');
    await database.connect();
    await database.initialize();

    // Create Express application
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`📖 API Documentation: http://localhost:${config.port}/api-docs`);
      logger.info(`🏥 Health Check: http://localhost:${config.port}/health`);
      logger.info(`🤖 AI Upselling: ${config.features.upsellEnabled ? 'Enabled' : 'Disabled'}`);
      logger.info(`🎟️  Promo Codes: ${config.features.summer10Enabled ? 'Enabled' : 'Disabled'}`);
      
      if (config.features.upsellEnabled) {
        logger.info(`🧠 Ollama Model: ${config.ollama.model} at ${config.ollama.baseUrl}`);
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await database.close();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Unhandled error during server startup:', error);
    process.exit(1);
  });
}

export default startServer;
