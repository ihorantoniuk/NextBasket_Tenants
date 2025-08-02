"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUnhandledRejection = exports.handleUncaughtException = exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.ApplicationError = void 0;
const logger_1 = require("./logger");
class ApplicationError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApplicationError = ApplicationError;
class ValidationError extends ApplicationError {
    constructor(message) {
        super(message, 400);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends ApplicationError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends ApplicationError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends ApplicationError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends ApplicationError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
const errorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let details = undefined;
    if ('statusCode' in error && 'isOperational' in error) {
        statusCode = error.statusCode;
        message = error.message;
    }
    else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        details = error.message;
    }
    else if (error.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }
    if (statusCode >= 500) {
        logger_1.logger.error('Server Error:', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }
    else {
        logger_1.logger.warn('Client Error:', {
            error: error.message,
            url: req.url,
            method: req.method,
            ip: req.ip,
            statusCode
        });
    }
    const response = {
        success: false,
        error: message
    };
    if (details) {
        response.details = details;
    }
    if (process.env.NODE_ENV === 'development' && error.stack) {
        response.stack = error.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
const handleUncaughtException = () => {
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception:', error);
        process.exit(1);
    });
};
exports.handleUncaughtException = handleUncaughtException;
const handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled Rejection:', reason);
        process.exit(1);
    });
};
exports.handleUnhandledRejection = handleUnhandledRejection;
//# sourceMappingURL=errorHandler.js.map