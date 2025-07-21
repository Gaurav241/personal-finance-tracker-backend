"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = require("../user.service");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Mock the database
jest.mock('../../db', () => ({
    db: {
        insert: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn(),
        returning: jest.fn(),
    },
}));
// Mock bcrypt
jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true),
}));
describe('UserService', () => {
    let userService;
    const db = require('../../db').db;
    beforeEach(() => {
        userService = new user_service_1.UserService();
        jest.clearAllMocks();
    });
    describe('createUser', () => {
        it('should create a user with hashed password', async () => {
            // Arrange
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
            };
            db.returning.mockResolvedValue([{
                    id: 1,
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    role: 'user',
                    created_at: new Date(),
                }]);
            // Act
            const result = await userService.createUser(userData);
            // Assert
            expect(bcryptjs_1.default.genSalt).toHaveBeenCalledWith(10);
            expect(bcryptjs_1.default.hash).toHaveBeenCalledWith(userData.password, 'salt');
            expect(db.insert).toHaveBeenCalledWith({
                email: userData.email,
                password: 'hashed_password',
                first_name: userData.firstName,
                last_name: userData.lastName,
                role: 'user',
            });
            expect(result).toEqual({
                id: 1,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: 'user',
                createdAt: expect.any(Date),
            });
        });
        it('should use provided role if specified', async () => {
            // Arrange
            const userData = {
                email: 'admin@example.com',
                password: 'admin123',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
            };
            db.returning.mockResolvedValue([{
                    id: 2,
                    email: userData.email,
                    first_name: userData.firstName,
                    last_name: userData.lastName,
                    role: 'admin',
                    created_at: new Date(),
                }]);
            // Act
            const result = await userService.createUser(userData);
            // Assert
            expect(db.insert).toHaveBeenCalledWith({
                email: userData.email,
                password: 'hashed_password',
                first_name: userData.firstName,
                last_name: userData.lastName,
                role: 'admin',
            });
            expect(result.role).toBe('admin');
        });
    });
    describe('verifyPassword', () => {
        it('should verify password correctly', async () => {
            // Act
            const result = await userService.verifyPassword('plain_password', 'hashed_password');
            // Assert
            expect(bcryptjs_1.default.compare).toHaveBeenCalledWith('plain_password', 'hashed_password');
            expect(result).toBe(true);
        });
    });
    describe('getUserByEmail', () => {
        it('should return user when found', async () => {
            // Arrange
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: 'hashed_password',
                first_name: 'Test',
                last_name: 'User',
                role: 'user',
                created_at: new Date(),
                updated_at: new Date(),
            };
            db.first.mockResolvedValue(mockUser);
            // Act
            const result = await userService.getUserByEmail('test@example.com');
            // Assert
            expect(db.where).toHaveBeenCalledWith({ email: 'test@example.com' });
            expect(result).toEqual({
                id: 1,
                email: 'test@example.com',
                password: 'hashed_password',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
        });
        it('should return null when user not found', async () => {
            // Arrange
            db.first.mockResolvedValue(null);
            // Act
            const result = await userService.getUserByEmail('nonexistent@example.com');
            // Assert
            expect(result).toBeNull();
        });
    });
});
