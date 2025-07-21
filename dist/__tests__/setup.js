"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Jest setup file for global test configuration
const globals_1 = require("@jest/globals");
// Increase timeout for async operations
globals_1.jest.setTimeout(10000);
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
