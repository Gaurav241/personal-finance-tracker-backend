"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const index_1 = __importDefault(require("../index"));
describe('Security Middleware Tests', () => {
    describe('Security Headers', () => {
        it('should set proper security headers', async () => {
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/health')
                .expect(200);
            // Check security headers
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
            expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
            expect(response.headers['content-security-policy']).toBeDefined();
            expect(response.headers['permissions-policy']).toBeDefined();
            expect(response.headers['x-dns-prefetch-control']).toBe('off');
            expect(response.headers['cross-origin-embedder-policy']).toBe('require-corp');
            expect(response.headers['cross-origin-opener-policy']).toBe('same-origin');
            expect(response.headers['cross-origin-resource-policy']).toBe('same-origin');
        });
        it('should include HSTS header in production', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';
            const response = await (0, supertest_1.default)(index_1.default)
                .get('/health')
                .expect(200);
            expect(response.headers['strict-transport-security']).toBeDefined();
            process.env.NODE_ENV = originalEnv;
        });
    });
    describe('CSRF Protection', () => {
        it('should reject POST requests without CSRF token', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/transactions')
                .send({
                amount: 100,
                description: 'Test transaction',
                categoryId: 1,
                transactionDate: '2025-01-01',
                type: 'expense'
            })
                .expect(403);
        });
        it('should allow GET requests without CSRF token', async () => {
            await (0, supertest_1.default)(index_1.default)
                .get('/health')
                .expect(200);
        });
    });
    describe('Rate Limiting', () => {
        it('should apply rate limiting to auth endpoints', async () => {
            const requests = [];
            // Make multiple requests quickly
            for (let i = 0; i < 10; i++) {
                requests.push((0, supertest_1.default)(index_1.default)
                    .post('/api/v1/auth/login')
                    .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                }));
            }
            const responses = await Promise.all(requests);
            // Some requests should be rate limited
            const rateLimitedResponses = responses.filter(res => res.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
    describe('Input Validation', () => {
        it('should sanitize HTML input', async () => {
            const maliciousInput = '<script>alert("xss")</script>Test';
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: 'ValidPassword123!',
                firstName: maliciousInput,
                lastName: 'User'
            });
            // Should not contain script tags
            if (response.body.user) {
                expect(response.body.user.firstName).not.toContain('<script>');
                expect(response.body.user.firstName).toBe('Test'); // Should be sanitized
            }
        });
        it('should validate email format', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send({
                email: 'invalid-email',
                password: 'ValidPassword123!',
                firstName: 'Test',
                lastName: 'User'
            })
                .expect(400);
        });
        it('should validate password strength', async () => {
            await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: 'weak',
                firstName: 'Test',
                lastName: 'User'
            })
                .expect(400);
        });
    });
    describe('Authentication Security', () => {
        it('should set secure cookies on successful login', async () => {
            // First register a user
            await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send({
                email: 'test@example.com',
                password: 'ValidPassword123!',
                firstName: 'Test',
                lastName: 'User'
            });
            // Then login
            const response = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/login')
                .send({
                email: 'test@example.com',
                password: 'ValidPassword123!'
            });
            // Check for secure cookies
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            const sessionCookie = cookies?.find((cookie) => cookie.startsWith('sessionToken='));
            const refreshCookie = cookies?.find((cookie) => cookie.startsWith('refreshToken='));
            const csrfCookie = cookies?.find((cookie) => cookie.startsWith('csrfToken='));
            expect(sessionCookie).toBeDefined();
            expect(refreshCookie).toBeDefined();
            expect(csrfCookie).toBeDefined();
            // Check cookie security attributes
            expect(sessionCookie).toContain('HttpOnly');
            expect(sessionCookie).toContain('SameSite=Strict');
            expect(refreshCookie).toContain('HttpOnly');
            expect(refreshCookie).toContain('SameSite=Strict');
        });
        it('should clear cookies on logout', async () => {
            // Register and login first
            await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send({
                email: 'test2@example.com',
                password: 'ValidPassword123!',
                firstName: 'Test',
                lastName: 'User'
            });
            const loginResponse = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/login')
                .send({
                email: 'test2@example.com',
                password: 'ValidPassword123!'
            });
            const cookies = loginResponse.headers['set-cookie'];
            const sessionCookie = cookies?.find((cookie) => cookie.startsWith('sessionToken='));
            // Logout
            const logoutResponse = await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/logout')
                .set('Cookie', sessionCookie || '');
            // Check that cookies are cleared
            const clearCookies = logoutResponse.headers['set-cookie'];
            expect(clearCookies).toBeDefined();
            const clearedSession = clearCookies?.find((cookie) => cookie.includes('sessionToken=;'));
            const clearedRefresh = clearCookies?.find((cookie) => cookie.includes('refreshToken=;'));
            expect(clearedSession).toBeDefined();
            expect(clearedRefresh).toBeDefined();
        });
    });
    describe('Brute Force Protection', () => {
        it('should block repeated failed login attempts', async () => {
            const email = 'bruteforce@example.com';
            // Register user first
            await (0, supertest_1.default)(index_1.default)
                .post('/api/v1/auth/register')
                .send({
                email,
                password: 'ValidPassword123!',
                firstName: 'Test',
                lastName: 'User'
            });
            // Make multiple failed login attempts
            const failedAttempts = [];
            for (let i = 0; i < 6; i++) {
                failedAttempts.push((0, supertest_1.default)(index_1.default)
                    .post('/api/v1/auth/login')
                    .send({
                    email,
                    password: 'wrongpassword'
                }));
            }
            const responses = await Promise.all(failedAttempts);
            // Later attempts should be blocked
            const blockedResponses = responses.filter(res => res.status === 429);
            expect(blockedResponses.length).toBeGreaterThan(0);
        });
    });
});
