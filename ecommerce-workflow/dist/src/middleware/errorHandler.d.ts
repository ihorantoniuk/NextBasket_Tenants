import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode: number;
    isOperational: boolean;
}
export declare class ApplicationError extends Error implements AppError {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
export declare class ValidationError extends ApplicationError {
    constructor(message: string);
}
export declare class NotFoundError extends ApplicationError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends ApplicationError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ApplicationError {
    constructor(message?: string);
}
export declare class ConflictError extends ApplicationError {
    constructor(message?: string);
}
export declare const errorHandler: (error: Error | AppError, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const handleUncaughtException: () => void;
export declare const handleUnhandledRejection: () => void;
//# sourceMappingURL=errorHandler.d.ts.map