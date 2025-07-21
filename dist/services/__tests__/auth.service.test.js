"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = require("../auth.service");
const user_service_1 = require("../user.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock dependencies
jest.mock('../user.service');
jest.mock('jsonwebtoken');
const mockedUserService = user_service_1.UserService;
const mockedJwt = jsonwebtoken_1.default;
describe('AuthService', () => {
    let authService;
    let mockUserServiceInstance;
    beforeEach(() => {
        mockUserServiceInstance = {
            createUser: jest.fn(),
            getUserByEmail: jest.fn(),
            getUserById: jest.fn(),
            verifyPassword: jest.fn(),
            hashPassword: jest.fn(),
        };
        mockedUserService.mockImplementation(() => mockUserServiceInstance);
        authService = new auth_service_1.AuthService();
        jest.clearAllMocks();
    });
    describe('register', () => {
        const userData = {
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User'
        };
        it('should register a new user successfully', async () => {
            const mockUser = {
                id: 1,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: 'user',
                createdAt: new Date()
            };
            mockUserServiceInstance.getUserByEmail.mockResolvedValue(null);
            mockUserServiceInstance.createUser.mockResolvedValue(mockUser);
            mockedJwt.sign.mockReturnValue('jwt-token');
            const result = await authService.register(userData);
            expect(mockUserServiceInstance.getUserByEmail).toHaveBeenCalledWith(userData.email);
            expect(mockUserServiceInstance.createUser).toHaveBeenCalledWith(userData);
            expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: mockUser.id, email: mockUser.email, role: mockUser.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            expect(result).toEqual({
                user: mockUser,
                token: 'jwt-token',
                refreshToken: expect.any(String)
            });
        });
        it('should throw error if user already exists', async () => {
            const existingUser = {
                id: 1,
                email: userData.email,
                firstName: 'Existing',
                lastName: 'User',
                role: 'user',
                password: 'hashedPassword',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockUserServiceInstance.getUserByEmail.mockResolvedValue(existingUser);
            await expect(authService.register(userData)).rejects.toThrow('User already exists');
            expect(mockUserServiceInstance.createUser).not.toHaveBeenCalled();
        });
        it('should handle user creation errors', async () => {
            mockUserServiceInstance.getUserByEmail.mockResolvedValue(null);
            mockUserServiceInstance.createUser.mockRejectedValue(new Error('Database error'));
            await expect(authService.register(userData)).rejects.toThrow('Database error');
        });
    });
    describe('login', () => {
        const loginData = {
            email: 'test@example.com',
            password: 'password123'
        };
        it('should login user successfully', async () => {
            const mockUser = {
                id: 1,
                email: loginData.email,
                password: 'hashed-password',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockUserServiceInstance.getUserByEmail.mockResolvedValue(mockUser);
            mockUserServiceInstance.verifyPassword.mockResolvedValue(true);
            mockedJwt.sign.mockReturnValue('jwt-token');
            const result = await authService.login(loginData);
            expect(mockUserServiceInstance.getUserByEmail).toHaveBeenCalledWith(loginData.email);
            expect(mockUserServiceInstance.verifyPassword).toHaveBeenCalledWith(loginData.password, mockUser.password);
            expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: mockUser.id, email: mockUser.email, role: mockUser.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    firstName: mockUser.firstName,
                    lastName: mockUser.lastName,
                    role: mockUser.role,
                    createdAt: mockUser.createdAt
                },
                token: 'jwt-token',
                refreshToken: expect.any(String)
            });
        });
        it('should throw error for non-existent user', async () => {
            mockUserServiceInstance.getUserByEmail.mockResolvedValue(null);
            await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
            expect(mockUserServiceInstance.verifyPassword).not.toHaveBeenCalled();
        });
        it('should throw error for invalid password', async () => {
            const mockUser = {
                id: 1,
                email: loginData.email,
                password: 'hashed-password',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockUserServiceInstance.getUserByEmail.mockResolvedValue(mockUser);
            mockUserServiceInstance.verifyPassword.mockResolvedValue(false);
            await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
        });
    });
    describe('refreshToken', () => {
        it('should refresh token successfully', async () => {
            const refreshToken = 'valid-refresh-token';
            const mockPayload = { userId: 1, email: 'test@example.com', role: 'user' };
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date()
            };
            mockedJwt.verify.mockReturnValue(mockPayload);
            mockUserServiceInstance.getUserById.mockResolvedValue(mockUser);
            mockedJwt.sign.mockReturnValue('new-jwt-token');
            const result = await authService.refreshToken(refreshToken);
            expect(mockedJwt.verify).toHaveBeenCalledWith(refreshToken, process.env.JWT_SECRET);
            expect(mockUserServiceInstance.getUserById).toHaveBeenCalledWith(mockPayload.userId);
            expect(mockedJwt.sign).toHaveBeenCalledWith({ userId: mockUser.id, email: mockUser.email, role: mockUser.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
            expect(result).toEqual({
                user: mockUser,
                token: 'new-jwt-token',
                refreshToken: expect.any(String)
            });
        });
        it('should throw error for invalid refresh token', async () => {
            const refreshToken = 'invalid-refresh-token';
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
        });
        it('should throw error when user not found', async () => {
            const refreshToken = 'valid-refresh-token';
            const mockPayload = { userId: 999, email: 'test@example.com', role: 'user' };
            mockedJwt.verify.mockReturnValue(mockPayload);
            mockUserServiceInstance.getUserById.mockResolvedValue(null);
            await expect(authService.refreshToken(refreshToken)).rejects.toThrow('User not found');
        });
    });
    describe('verifyToken', () => {
        it('should verify token successfully', async () => {
            const token = 'valid-jwt-token';
            const mockPayload = { userId: 1, email: 'test@example.com', role: 'user' };
            mockedJwt.verify.mockReturnValue(mockPayload);
            const result = await authService.verifyToken(token);
            expect(mockedJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(result).toEqual(mockPayload);
        });
        it('should throw error for invalid token', async () => {
            const token = 'invalid-jwt-token';
            mockedJwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            await expect(authService.verifyToken(token)).rejects.toThrow('Invalid token');
        });
    });
});
