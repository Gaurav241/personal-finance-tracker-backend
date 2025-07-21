"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_middleware_1 = require("../auth.middleware");
// Mock jwt
jest.mock('jsonwebtoken');
describe('Auth Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
    });
    describe('authenticateToken', () => {
        it('should return 401 if no token is provided', () => {
            mockRequest.headers = {};
            (0, auth_middleware_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 403 if token is invalid', () => {
            mockRequest.headers = { authorization: 'Bearer invalid_token' };
            jsonwebtoken_1.default.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });
            (0, auth_middleware_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should set req.user and call next if token is valid', () => {
            const user = { id: 1, email: 'test@example.com', role: 'user' };
            mockRequest.headers = { authorization: 'Bearer valid_token' };
            jsonwebtoken_1.default.verify.mockReturnValue(user);
            (0, auth_middleware_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toEqual(user);
            expect(nextFunction).toHaveBeenCalled();
        });
    });
    describe('authorizeRole', () => {
        it('should return 401 if user is not authenticated', () => {
            mockRequest.user = undefined;
            const middleware = (0, auth_middleware_1.authorizeRole)(['user']);
            middleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should call next if user has admin role regardless of required roles', () => {
            mockRequest.user = { id: 1, email: 'admin@example.com', role: 'admin' };
            const middleware = (0, auth_middleware_1.authorizeRole)(['user']);
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should return 403 if user does not have required role', () => {
            mockRequest.user = { id: 1, email: 'readonly@example.com', role: 'read-only' };
            const middleware = (0, auth_middleware_1.authorizeRole)(['user']);
            middleware(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Insufficient permissions',
                requiredRoles: ['user'],
                userRole: 'read-only'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should call next if user has required role', () => {
            mockRequest.user = { id: 1, email: 'user@example.com', role: 'user' };
            const middleware = (0, auth_middleware_1.authorizeRole)(['user', 'admin']);
            middleware(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
    });
    describe('authorizeOwnership', () => {
        it('should return 401 if user is not authenticated', () => {
            mockRequest.user = undefined;
            (0, auth_middleware_1.authorizeOwnership)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should call next if user is admin', () => {
            mockRequest.user = { id: 1, email: 'admin@example.com', role: 'admin' };
            mockRequest.params = { userId: '2' };
            (0, auth_middleware_1.authorizeOwnership)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should return 403 if user tries to access another user\'s resource', () => {
            mockRequest.user = { id: 1, email: 'user@example.com', role: 'user' };
            mockRequest.params = { userId: '2' };
            (0, auth_middleware_1.authorizeOwnership)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'You can only access your own resources' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should call next if user accesses their own resource', () => {
            mockRequest.user = { id: 1, email: 'user@example.com', role: 'user' };
            mockRequest.params = { userId: '1' };
            (0, auth_middleware_1.authorizeOwnership)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
    });
    describe('authorizeWriteAccess', () => {
        it('should return 401 if user is not authenticated', () => {
            mockRequest.user = undefined;
            (0, auth_middleware_1.authorizeWriteAccess)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 403 if read-only user attempts write operation', () => {
            mockRequest.user = { id: 1, email: 'readonly@example.com', role: 'read-only' };
            mockRequest.method = 'POST';
            (0, auth_middleware_1.authorizeWriteAccess)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Read-only users cannot perform write operations',
                method: 'POST',
                userRole: 'read-only'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should call next if read-only user attempts read operation', () => {
            mockRequest.user = { id: 1, email: 'readonly@example.com', role: 'read-only' };
            mockRequest.method = 'GET';
            (0, auth_middleware_1.authorizeWriteAccess)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
        it('should call next if user with write permissions attempts write operation', () => {
            mockRequest.user = { id: 1, email: 'user@example.com', role: 'user' };
            mockRequest.method = 'POST';
            (0, auth_middleware_1.authorizeWriteAccess)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
    });
    describe('authorizeAdmin', () => {
        it('should return 401 if user is not authenticated', () => {
            mockRequest.user = undefined;
            (0, auth_middleware_1.authorizeAdmin)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 403 if user is not admin', () => {
            mockRequest.user = { id: 1, email: 'user@example.com', role: 'user' };
            (0, auth_middleware_1.authorizeAdmin)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(403);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Admin access required',
                userRole: 'user'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should call next if user is admin', () => {
            mockRequest.user = { id: 1, email: 'admin@example.com', role: 'admin' };
            (0, auth_middleware_1.authorizeAdmin)(mockRequest, mockResponse, nextFunction);
            expect(nextFunction).toHaveBeenCalled();
        });
    });
});
