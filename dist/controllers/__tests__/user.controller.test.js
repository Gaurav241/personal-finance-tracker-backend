"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../../index"));
const user_service_1 = require("../../services/user.service");
const db_service_1 = __importDefault(require("../../services/db.service"));
// Mock the user service and database
jest.mock('../../services/user.service');
jest.mock('../../services/db.service');
const mockedUserService = user_service_1.userService;
const mockedDb = db_service_1.default;
// Mock authentication middleware to simulate authenticated requests
jest.mock('../../middleware/auth.middleware', () => ({
    authenticateToken: (req, res, next) => {
        req.user = {
            id: 1,
            email: 'admin@example.com',
            role: 'admin'
        };
        next();
    },
    requireRole: (roles) => (req, res, next) => {
        if (roles.includes(req.user?.role)) {
            next();
        }
        else {
            res.status(403).json({ message: 'Insufficient permissions' });
        }
    }
}));
describe('UserController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/v1/users', () => {
        it('should get all users successfully', async () => {
            const mockUsers = [
                {
                    id: 1,
                    email: 'user1@example.com',
                    first_name: 'User',
                    last_name: 'One',
                    role: 'user',
                    created_at: new Date()
                },
                {
                    id: 2,
                    email: 'user2@example.com',
                    first_name: 'User',
                    last_name: 'Two',
                    role: 'admin',
                    created_at: new Date()
                }
            ];
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockResolvedValue(mockUsers)
            };
            mockedDb.mockImplementation(() => mockQueryBuilder);
            mockedDb.select = mockQueryBuilder.select;
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/v1/users')
                .expect(200);
            expect(response.body).toEqual([
                {
                    id: 1,
                    email: 'user1@example.com',
                    firstName: 'User',
                    lastName: 'One',
                    role: 'user',
                    createdAt: expect.any(String)
                },
                {
                    id: 2,
                    email: 'user2@example.com',
                    firstName: 'User',
                    lastName: 'Two',
                    role: 'admin',
                    createdAt: expect.any(String)
                }
            ]);
        });
        it('should handle database errors', async () => {
            const mockQueryBuilder = {
                select: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockRejectedValue(new Error('Database error'))
            };
            mockedDb.mockImplementation(() => mockQueryBuilder);
            mockedDb.select = mockQueryBuilder.select;
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/v1/users')
                .expect(500);
            expect(response.body).toEqual({
                message: 'Error retrieving users'
            });
        });
    });
    describe('GET /api/v1/users/:id', () => {
        it('should get user by ID successfully', async () => {
            const mockUser = {
                id: 1,
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date()
            };
            mockedUserService.getUserById.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/v1/users/1')
                .expect(200);
            expect(response.body).toEqual(mockUser);
            expect(mockedUserService.getUserById).toHaveBeenCalledWith(1);
        });
        it('should return 404 when user not found', async () => {
            mockedUserService.getUserById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/v1/users/999')
                .expect(404);
            expect(response.body).toEqual({
                message: 'User not found'
            });
        });
        it('should handle invalid user ID', async () => {
            mockedUserService.getUserById.mockRejectedValue(new Error('Invalid ID'));
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/api/v1/users/invalid')
                .expect(500);
            expect(response.body).toEqual({
                message: 'Error retrieving user'
            });
        });
    });
    describe('PUT /api/v1/users/:id', () => {
        it('should update user successfully', async () => {
            const existingUser = {
                id: 1,
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date()
            };
            const updatedUser = {
                id: 1,
                email: 'user@example.com',
                first_name: 'Updated',
                last_name: 'User',
                role: 'user',
                created_at: new Date()
            };
            mockedUserService.getUserById.mockResolvedValue(existingUser);
            const mockQueryBuilder = {
                update: jest.fn().mockReturnThis(),
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                returning: jest.fn().mockResolvedValue([updatedUser])
            };
            mockedDb.mockImplementation(() => mockQueryBuilder);
            mockedDb.update = mockQueryBuilder.update;
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/v1/users/1')
                .send({
                firstName: 'Updated',
                lastName: 'User'
            })
                .expect(200);
            expect(response.body).toEqual({
                id: 1,
                email: 'user@example.com',
                firstName: 'Updated',
                lastName: 'User',
                role: 'user',
                createdAt: expect.any(String)
            });
        });
        it('should return 404 when user not found', async () => {
            mockedUserService.getUserById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/v1/users/999')
                .send({
                firstName: 'Updated'
            })
                .expect(404);
            expect(response.body).toEqual({
                message: 'User not found'
            });
        });
    });
    describe('PUT /api/v1/users/:id/password', () => {
        it('should change password successfully', async () => {
            const mockUser = {
                id: 1,
                email: 'user@example.com',
                password: 'hashed-old-password',
                first_name: 'Test',
                last_name: 'User',
                role: 'user'
            };
            const mockQueryBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(mockUser),
                update: jest.fn().mockResolvedValue(1)
            };
            mockedDb.mockImplementation(() => mockQueryBuilder);
            mockedDb.from = mockQueryBuilder.from;
            mockedUserService.verifyPassword.mockResolvedValue(true);
            mockedUserService.hashPassword.mockResolvedValue('hashed-new-password');
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/v1/users/1/password')
                .send({
                currentPassword: 'oldPassword123',
                newPassword: 'newPassword123!'
            })
                .expect(200);
            expect(response.body).toEqual({
                message: 'Password changed successfully'
            });
            expect(mockedUserService.verifyPassword).toHaveBeenCalledWith('oldPassword123', 'hashed-old-password');
            expect(mockedUserService.hashPassword).toHaveBeenCalledWith('newPassword123!');
        });
        it('should return 400 for incorrect current password', async () => {
            const mockUser = {
                id: 1,
                password: 'hashed-old-password'
            };
            const mockQueryBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(mockUser)
            };
            mockedDb.mockImplementation(() => mockQueryBuilder);
            mockedDb.from = mockQueryBuilder.from;
            mockedUserService.verifyPassword.mockResolvedValue(false);
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/v1/users/1/password')
                .send({
                currentPassword: 'wrongPassword',
                newPassword: 'newPassword123!'
            })
                .expect(400);
            expect(response.body).toEqual({
                message: 'Current password is incorrect'
            });
        });
        it('should return 404 when user not found', async () => {
            const mockQueryBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                first: jest.fn().mockResolvedValue(null)
            };
            mockedDb.mockImplementation(() => mockQueryBuilder);
            mockedDb.from = mockQueryBuilder.from;
            const response = await (0, supertest_1.default)(index_1.default)
                .put('/api/v1/users/999/password')
                .send({
                currentPassword: 'oldPassword123',
                newPassword: 'newPassword123!'
            })
                .expect(404);
            expect(response.body).toEqual({
                message: 'User not found'
            });
        });
    });
    describe('DELETE /api/v1/users/:id', () => {
        it('should delete user successfully', async () => {
            const existingUser = {
                id: 1,
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'user',
                createdAt: new Date()
            };
            mockedUserService.getUserById.mockResolvedValue(existingUser);
            const mockQueryBuilder = {
                from: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                delete: jest.fn().mockResolvedValue(1)
            };
            mockedDb.mockImplementation(() => mockQueryBuilder);
            mockedDb.from = mockQueryBuilder.from;
            const response = await (0, supertest_1.default)(index_1.default)
                .delete('/api/v1/users/1')
                .expect(200);
            expect(response.body).toEqual({
                message: 'User deleted successfully'
            });
        });
        it('should return 404 when user not found', async () => {
            mockedUserService.getUserById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(index_1.default)
                .delete('/api/v1/users/999')
                .expect(404);
            expect(response.body).toEqual({
                message: 'User not found'
            });
        });
    });
});
