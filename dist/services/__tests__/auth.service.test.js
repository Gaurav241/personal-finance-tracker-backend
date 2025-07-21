"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config/config"));
// Mock user service
jest.mock('../user.service', () => ({
    userService: {
        createUser: jest.fn(),
        getUserByEmail: jest.fn(),
        getUserById: jest.fn(),
        verifyPassword: jest.fn(),
    }
}));
// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock_token'),
    verify: jest.fn(),
}));
describe('AuthService', () => {
    let authService;
    const userService = require('../user.service').userService;
    beforeEach(() => {
        authService = new auth_service_1.AuthService();
        jest.clearAllMocks();
    });
    describe('register', () => {
        it('should register a user and return user with token', async () => {
            // Arrange
            const userData = {
                email: 'test@example.com',
                password: 'Password123!',
                firstName: 'Test',
                lastName: 'User',
            };
            const createdUser = {
                id: 1,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: 'user',
                createdAt: new Date(),
            };
            userService.createUser.mockResolvedValue(createdUser);
            // Act
            const result = await authService.register(userData);
            // Assert
            expect(userService.createUser).toHaveBeenCalledWith(userData);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: createdUser.id, email: createdUser.email, role: createdUser.role }, config_1.default.jwtSecret, { expiresIn: config_1.default.jwtExpiresIn });
            expect(result).toEqual({
                user: createdUser,
                token: 'mock_token',
            });
        });
    });
    describe('login', () => {
        it('should login a user and return user with token', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
                password: 'Password123!',
            };
            const user = {
                id: 1,
                email: loginData.email,
                password: 'hashed_password',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            userService.getUserByEmail.mockResolvedValue(user);
            userService.verifyPassword.mockResolvedValue(true);
            // Act
            const result = await authService.login(loginData);
            // Assert
            expect(userService.getUserByEmail).toHaveBeenCalledWith(loginData.email);
            expect(userService.verifyPassword).toHaveBeenCalledWith(loginData.password, user.password);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: user.id, email: user.email, role: user.role }, config_1.default.jwtSecret, { expiresIn: config_1.default.jwtExpiresIn });
            expect(result).toEqual({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    createdAt: user.createdAt,
                },
                token: 'mock_token',
            });
        });
        it('should throw error if user not found', async () => {
            // Arrange
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'Password123!',
            };
            userService.getUserByEmail.mockResolvedValue(null);
            // Act & Assert
            await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
            expect(userService.getUserByEmail).toHaveBeenCalledWith(loginData.email);
            expect(userService.verifyPassword).not.toHaveBeenCalled();
        });
        it('should throw error if password is invalid', async () => {
            // Arrange
            const loginData = {
                email: 'test@example.com',
                password: 'WrongPassword123!',
            };
            const user = {
                id: 1,
                email: loginData.email,
                password: 'hashed_password',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            userService.getUserByEmail.mockResolvedValue(user);
            userService.verifyPassword.mockResolvedValue(false);
            // Act & Assert
            await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
            expect(userService.getUserByEmail).toHaveBeenCalledWith(loginData.email);
            expect(userService.verifyPassword).toHaveBeenCalledWith(loginData.password, user.password);
        });
    });
    describe('refreshToken', () => {
        it('should refresh token for valid user', async () => {
            // Arrange
            const userId = 1;
            const user = {
                id: userId,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date(),
            };
            userService.getUserById.mockResolvedValue(user);
            // Act
            const result = await authService.refreshToken(userId);
            // Assert
            expect(userService.getUserById).toHaveBeenCalledWith(userId);
            expect(jsonwebtoken_1.default.sign).toHaveBeenCalledWith({ id: user.id, email: user.email, role: user.role }, config_1.default.jwtSecret, { expiresIn: config_1.default.jwtExpiresIn });
            expect(result).toBe('mock_token');
        });
        it('should throw error if user not found', async () => {
            // Arrange
            const userId = 999;
            userService.getUserById.mockResolvedValue(null);
            // Act & Assert
            await expect(authService.refreshToken(userId)).rejects.toThrow('User not found');
            expect(userService.getUserById).toHaveBeenCalledWith(userId);
        });
    });
    describe('verifyToken', () => {
        it('should verify valid token', () => {
            // Arrange
            const token = 'valid_token';
            const decodedToken = { id: 1, email: 'test@example.com', role: 'user' };
            jsonwebtoken_1.default.verify.mockReturnValue(decodedToken);
            // Act
            const result = authService.verifyToken(token);
            // Assert
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith(token, config_1.default.jwtSecret);
            expect(result).toBe(decodedToken);
        });
        it('should return null for invalid token', () => {
            // Arrange
            const token = 'invalid_token';
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            // Act
            const result = authService.verifyToken(token);
            // Assert
            expect(jsonwebtoken_1.default.verify).toHaveBeenCalledWith(token, config_1.default.jwtSecret);
            expect(result).toBeNull();
        });
    });
});
