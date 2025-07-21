import { AuthService } from '../auth.service';
import { userService } from '../user.service';
import jwt from 'jsonwebtoken';
import { CreateUserDTO, UserLoginDTO, UserRole } from '../../models/user.model';

// Mock dependencies
jest.mock('../user.service');
jest.mock('jsonwebtoken');

const mockedJwt = jwt as jest.Mocked<typeof jwt>;

jest.mock('../user.service', () => ({
  userService: {
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    getUserById: jest.fn(),
    verifyPassword: jest.fn(),
    hashPassword: jest.fn(),
  }
}));

const mockUserService = userService as jest.Mocked<typeof userService>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    const userData: CreateUserDTO = {
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
        role: 'user' as UserRole,
        createdAt: new Date()
      };

      mockUserService.createUser.mockResolvedValue(mockUser);
      mockedJwt.sign.mockReturnValue('jwt-token' as any);

      const result = await authService.register(userData);
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(mockedJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(1,
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        expect.any(String),
        { expiresIn: '1d' }
      );
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(2,
        { id: mockUser.id, email: mockUser.email, role: mockUser.role, type: 'refresh' },
        expect.any(String),
        { expiresIn: '7d' }
      );

      expect(result).toEqual({
        user: mockUser,
        token: 'jwt-token',
        refreshToken: expect.any(String)
      });
    });

    it('should throw error if user creation fails', async () => {
      mockUserService.createUser.mockRejectedValue(new Error('Email already exists'));

      await expect(authService.register(userData)).rejects.toThrow('Email already exists');
    });

    it('should handle user creation errors', async () => {
      mockUserService.getUserByEmail.mockResolvedValue(null);
      mockUserService.createUser.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(userData)).rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    const loginData: UserLoginDTO = {
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
        role: 'user' as UserRole,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(true);
      mockedJwt.sign.mockReturnValue('jwt-token' as any);

      const result = await authService.login(loginData);

      expect(mockUserService.getUserByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockUserService.verifyPassword).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(mockedJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(1,
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        expect.any(String),
        { expiresIn: '1d' }
      );
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(2,
        { id: mockUser.id, email: mockUser.email, role: mockUser.role, type: 'refresh' },
        expect.any(String),
        { expiresIn: '7d' }
      );

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
      mockUserService.getUserByEmail.mockResolvedValue(null);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
      expect(mockUserService.verifyPassword).not.toHaveBeenCalled();
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        id: 1,
        email: loginData.email,
        password: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as UserRole,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      mockUserService.verifyPassword.mockResolvedValue(false);

      await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = { id: 1, email: 'test@example.com', role: 'user' };
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user' as UserRole,
        createdAt: new Date()
      };

      mockedJwt.verify.mockReturnValue(mockPayload as any);
      mockUserService.getUserById.mockResolvedValue(mockUser);
      mockedJwt.sign.mockReturnValue('new-jwt-token' as any);

      const result = await authService.refreshToken(refreshToken);

      expect(mockedJwt.verify).toHaveBeenCalledWith(refreshToken, expect.any(String));
      expect(mockUserService.getUserById).toHaveBeenCalledWith(mockPayload.id);
      expect(mockedJwt.sign).toHaveBeenCalledTimes(2);
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(1,
        { id: mockUser.id, email: mockUser.email, role: mockUser.role },
        expect.any(String),
        { expiresIn: '1d' }
      );
      expect(mockedJwt.sign).toHaveBeenNthCalledWith(2,
        { id: mockUser.id, email: mockUser.email, role: mockUser.role, type: 'refresh' },
        expect.any(String),
        { expiresIn: '7d' }
      );

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
      const mockPayload = { id: 999, email: 'test@example.com', role: 'user' };

      mockedJwt.verify.mockReturnValue(mockPayload as any);
      mockUserService.getUserById.mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('User not found');
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const token = 'valid-jwt-token';
      const mockPayload = { id: 1, email: 'test@example.com', role: 'user' };

      mockedJwt.verify.mockReturnValue(mockPayload as any);

      const result = await authService.verifyToken(token);

      expect(mockedJwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(result).toEqual(mockPayload);
    });

    it('should return null for invalid token', () => {
      const token = 'invalid-jwt-token';

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = authService.verifyToken(token);
      expect(result).toBeNull();
    });
  });


})