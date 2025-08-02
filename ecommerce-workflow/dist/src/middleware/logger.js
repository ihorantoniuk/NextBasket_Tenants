"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config");
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json());
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
}));
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'ecommerce-workflow' },
    transports: [
        new winston_1.default.transports.Console({
            format: consoleFormat
        }),
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }),
        new winston_1.default.transports.File({
            filename: 'logs/combined.log'
        })
    ],
});
const fs_1 = __importDefault(require("fs"));
if (!fs_1.default.existsSync('logs')) {
    fs_1.default.mkdirSync('logs');
}
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map