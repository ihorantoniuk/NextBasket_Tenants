import sqlite3 from 'sqlite3';
export declare class Database {
    private db;
    connect(): Promise<void>;
    initialize(): Promise<void>;
    private seedSampleData;
    getDb(): sqlite3.Database;
    get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
    all<T = any>(sql: string, params?: any[]): Promise<T[]>;
    run(sql: string, params?: any[]): Promise<sqlite3.RunResult>;
    close(): Promise<void>;
}
export declare const database: Database;
//# sourceMappingURL=index.d.ts.map