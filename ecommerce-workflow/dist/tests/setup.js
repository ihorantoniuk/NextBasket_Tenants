"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../src/middleware/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.UPSELL_ENABLED = 'true';
process.env.LOG_LEVEL = 'error';
jest.setTimeout(30000);
beforeEach(() => {
    jest.clearAllMocks();
});
afterAll(() => {
});
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};
//# sourceMappingURL=setup.js.map