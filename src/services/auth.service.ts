import jwt from 'jsonwebtoken';
import { userService } from './user.service';
import config from '../config/config';
import { AuthResult, RefreshResult, UserDTO, UserLoginDTO, CreateUserDTO } from '../models/user.model';

/**
 * Authentication service for handling user authentication and token management
 */
export class AuthService {
  /**
   * Register a new user
   * @param userData User registration data
   * @returns Authentication result with user and token
   */
  async register(userData: CreateUserDTO): Promise<AuthResult> {
    try {
      // Create user using user service
      const user = await userService.createUser(userData);
      
      // Generate tokens for the new user
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);
      
      return { user, token, refreshToken };
    } catch (error) {
      // Re-throw the error from user service
      throw error;
    }
  }

  /**
   * Login a user
   * @param loginData User login credentials
   * @returns Authentication result with user and token
   * @throws Error if credentials are invalid
   */
  async login(loginData: UserLoginDTO): Promise<AuthResult> {
    // Get user by email
    const user = await userService.getUserByEmail(loginData.email);
    
    // Check if user exists
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // Verify password
    const isPasswordValid = await userService.verifyPassword(
      loginData.password,
      user.password
    );
    
    // Check if password is valid
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Generate tokens
    const userDTO = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    };
    
    const token = this.generateToken(userDTO);
    const refreshToken = this.generateRefreshToken(userDTO);
    
    // Return user without password and tokens
    return {
      user: userDTO,
      token,
      refreshToken
    };
  }

  /**
   * Refresh user token
   * @param refreshToken Refresh token to verify
   * @returns New tokens and user data
   * @throws Error if token is invalid or user not found
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret || config.jwtSecret) as any;
      
      // Get user by ID
      const user = await userService.getUserById(decoded.id);
      
      // Check if user exists
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate new tokens
      const userDTO = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      };
      
      const newToken = this.generateToken(userDTO);
      const newRefreshToken = this.generateRefreshToken(userDTO);
      
      return {
        user: userDTO,
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      if (error instanceof Error && error.message === 'User not found') {
        throw error;
      }
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Generate JWT token for user
   * @param user User data to include in token
   * @returns JWT token
   */
  private generateToken(user: UserDTO): string {
    // Create payload with user data
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    // Sign token with secret and expiration
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn
    } as jwt.SignOptions);
  }

  /**
   * Generate refresh token for user
   * @param user User data to include in token
   * @returns Refresh token
   */
  private generateRefreshToken(user: UserDTO): string {
    // Create payload with user data
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh'
    };
    
    // Sign token with secret and longer expiration
    return jwt.sign(payload, config.jwtRefreshSecret || config.jwtSecret, {
      expiresIn: '7d' // 7 days for refresh token
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode JWT token
   * @param token JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();