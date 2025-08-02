"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const database_1 = require("./database");
const logger_1 = require("./middleware/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const app_1 = __importDefault(require("./app"));
(0, errorHandler_1.handleUncaughtException)();
(0, errorHandler_1.handleUnhandledRejection)();
async function startServer() {
    try {
        logger_1.logger.info('Starting E-commerce Workflow server...');
        logger_1.logger.info('Connecting to database...');
        await database_1.database.connect();
        await database_1.database.initialize();
        const app = (0, app_1.default)();
        const server = app.listen(config_1.config.port, () => {
            logger_1.logger.info(`🚀 Server running on port ${config_1.config.port}`);
            logger_1.logger.info(`📊 Environment: ${config_1.config.nodeEnv}`);
            logger_1.logger.info(`📖 API Documentation: http://localhost:${config_1.config.port}/api-docs`);
            logger_1.logger.info(`🏥 Health Check: http://localhost:${config_1.config.port}/health`);
            logger_1.logger.info(`🤖 AI Upselling: ${config_1.config.features.upsellEnabled ? 'Enabled' : 'Disabled'}`);
            logger_1.logger.info(`🎟️  Promo Codes: ${config_1.config.features.summer10Enabled ? 'Enabled' : 'Disabled'}`);
            if (config_1.config.features.upsellEnabled) {
                logger_1.logger.info(`🧠 Ollama Model: ${config_1.config.ollama.model} at ${config_1.config.ollama.baseUrl}`);
            }
        });
        const gracefulShutdown = async (signal) => {
            logger_1.logger.info(`${signal} received, shutting down gracefully...`);
            server.close(async () => {
                logger_1.logger.info('HTTP server closed');
                try {
                    await database_1.database.close();
                    logger_1.logger.info('Database connection closed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.logger.error('Error during graceful shutdown:', error);
                    process.exit(1);
                }
            });
            setTimeout(() => {
                logger_1.logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    startServer().catch((error) => {
        logger_1.logger.error('Unhandled error during server startup:', error);
        process.exit(1);
    });
}
exports.default = startServer;
//# sourceMappingURL=server.js.map