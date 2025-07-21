import jwt from 'jsonwebtoken';
import { userService } from './user.service';
import config from '../config/config';
import { AuthResult, UserDTO, UserLoginDTO, CreateUserDTO } from '../models/user.model';

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
    // Create user using user service
    const user = await userService.createUser(userData);
    
    // Generate token for the new user
    const token = this.generateToken(user);
    
    return { user, token };
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
    
    // Generate token
    const token = this.generateToken({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt
    });
    
    // Return user without password and token
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Refresh user token
   * @param userId User ID from existing token
   * @returns New token
   * @throws Error if user not found
   */
  async refreshToken(userId: number): Promise<string> {
    // Get user by ID
    const user = await userService.getUserById(userId);
    
    // Check if user exists
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate new token
    return this.generateToken(user);
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