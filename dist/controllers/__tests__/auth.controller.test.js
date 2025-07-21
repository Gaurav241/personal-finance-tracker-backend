"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../index"));
const auth_service_1 = require("../../services/auth.service");
// Mock the auth service
jest.mock('../../services/auth.service');
const mockedAuthService = auth_service_1.authService;
// Mock security middleware functions
jest.mock('../../middleware/security.middleware', () => ({
    trackFailedAttempt: jest.fn(),
    clearFailedAttempts: jest.fn(),
    setSecureSessionCookie: jest.fn(),
    setSecureRefreshCookie: jest.fn(),
    clearAuthCookies: jest.fn(),
    validatePasswordStrength: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
}));
describe('AuthController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/v1/auth/register', () => {
        const validUserData = {
            email: 'test@example.com',
            password: 'ValidPassword123!',
            firstName: 'Test',
            lastName: 'User'
        };
        it('should register a new user successfully', async () => {
            const mockResult = {
                user: {
                    id: 1,
                    email: validUserData.email,
                    firstName: validUserData.firstName,
                    lastName: validUserData.lastName,
                    role: 'user',
                    createdAt: new Date()
                },
                token: 'jwt-token',
                refreshToken: 'refresh-token'
            };
            mockedAuthService.register.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send(validUserData)
                .expect(201);
            expect(response.body).toEqual({
                success: true,
                user: mockResult.user,
                csrfToken: expect.any(String),
                message: 'User registered successfully'
            });
            expect(mockedAuthService.register).toHaveBeenCalledWith({
                email: validUserData.email,
                password: validUserData.password,
                firstName: validUserData.firstName,
                lastName: validUserData.lastName,
                role: undefined
            });
        });
        it('should return 400 for weak password', async () => {
            const { validatePasswordStrength } = require('../../middleware/security.middleware');
            validatePasswordStrength.mockReturnValue({
                isValid: false,
                errors: ['Password must be at least 8 characters long']
            });
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send({
                ...validUserData,
                password: 'weak'
            })
                .expect(400);
            expect(response.body).toEqual({
                message: 'Password does not meet security requirements',
                errors: ['Password must be at least 8 characters long']
            });
        });
        it('should return 409 for duplicate email', async () => {
            mockedAuthService.register.mockRejectedValue(new Error('duplicate key'));
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send(validUserData)
                .expect(409);
            expect(response.body).toEqual({
                success: false,
                message: 'Email already in use'
            });
        });
        it('should return 500 for server errors', async () => {
            mockedAuthService.register.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send(validUserData)
                .expect(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Database error'
            });
        });
    });
    describe('POST /api/v1/auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'ValidPassword123!'
        };
        it('should login user successfully', async () => {
            const mockResult = {
                user: {
                    id: 1,
                    email: validLoginData.email,
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'user',
                    createdAt: new Date()
                },
                token: 'jwt-token',
                refreshToken: 'refresh-token'
            };
            mockedAuthService.login.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/login')
                .send(validLoginData)
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                user: mockResult.user,
                csrfToken: expect.any(String),
                message: 'Login successful'
            });
            expect(mockedAuthService.login).toHaveBeenCalledWith(validLoginData);
        });
        it('should return 401 for invalid credentials', async () => {
            mockedAuthService.login.mockRejectedValue(new Error('Invalid email or password'));
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/login')
                .send(validLoginData)
                .expect(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Invalid email or password'
            });
        });
        it('should return 500 for server errors', async () => {
            mockedAuthService.login.mockRejectedValue(new Error('Database connection failed'));
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/login')
                .send(validLoginData)
                .expect(500);
            expect(response.body).toEqual({
                success: false,
                message: 'Error logging in'
            });
        });
    });
    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh token successfully', async () => {
            const mockResult = {
                user: {
                    id: 1,
                    email: 'test@example.com',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'user',
                    createdAt: new Date()
                },
                token: 'new-jwt-token',
                refreshToken: 'new-refresh-token'
            };
            mockedAuthService.refreshToken.mockResolvedValue(mockResult);
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/refresh')
                .set('Cookie', 'refreshToken=valid-refresh-token')
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                user: mockResult.user,
                csrfToken: expect.any(String),
                message: 'Token refreshed successfully'
            });
            expect(mockedAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
        });
        it('should return 401 when refresh token is missing', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/refresh')
                .expect(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Refresh token required'
            });
        });
        it('should return 401 for invalid refresh token', async () => {
            mockedAuthService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/refresh')
                .set('Cookie', 'refreshToken=invalid-token')
                .expect(401);
            expect(response.body).toEqual({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        });
    });
    describe('POST /api/v1/auth/logout', () => {
        it('should logout user successfully', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/logout')
                .expect(200);
            expect(response.body).toEqual({
                success: true,
                message: 'Logged out successfully'
            });
        });
    });
});
