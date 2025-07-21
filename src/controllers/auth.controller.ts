import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { CreateUserDTO, UserLoginDTO } from '../models/user.model';
import { validationResult } from 'express-validator';

/**
 * Authentication controller for handling auth-related requests
 */
export class AuthController {
  /**
   * Register a new user
   * @param req Express request
   * @param res Express response
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Extract user data from request body
      const userData: CreateUserDTO = {
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role // This will be ignored unless admin creates the user
      };

      // Register user
      const result = await authService.register(userData);

      // Return user and token
      res.status(201).json(result);
    } catch (error: any) {
      // Handle duplicate email error
      if (error.message.includes('duplicate key')) {
        res.status(409).json({ message: 'Email already in use' });
        return;
      }

      // Handle other errors
      res.status(500).json({ message: error.message || 'Error registering user' });
    }
  }

  /**
   * Login a user
   * @param req Express request
   * @param res Express response
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      // Extract login data from request body
      const loginData: UserLoginDTO = {
        email: req.body.email,
        password: req.body.password
      };

      // Login user
      const result = await authService.login(loginData);

      // Return user and token
      res.status(200).json(result);
    } catch (error: any) {
      // Handle invalid credentials
      if (error.message === 'Invalid email or password') {
        res.status(401).json({ message: error.message });
        return;
      }

      // Handle other errors
      res.status(500).json({ message: 'Error logging in' });
    }
  }

  /**
   * Refresh user token
   * @param req Express request
   * @param res Express response
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get user ID from authenticated request
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      // Refresh token
      const token = await authService.refreshToken(userId);

      // Return new token
      res.status(200).json({ token });
    } catch (error: any) {
      // Handle user not found
      if (error.message === 'User not found') {
        res.status(404).json({ message: error.message });
        return;
      }

      // Handle other errors
      res.status(500).json({ message: 'Error refreshing token' });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();