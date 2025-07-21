import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { CreateUserDTO, UserLoginDTO } from '../models/user.model';
import { 
  trackFailedAttempt, 
  clearFailedAttempts,
  setSecureSessionCookie,
  setSecureRefreshCookie,
  clearAuthCookies,
  validatePasswordStrength
} from '../middleware/security.middleware';
import { AppError } from '../utils/errorHandler';

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
      // Validate password strength
      const passwordValidation = validatePasswordStrength(req.body.password);
      if (!passwordValidation.isValid) {
        res.status(400).json({ 
          message: 'Password does not meet security requirements',
          errors: passwordValidation.errors 
        });
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

      // Set secure cookies for tokens
      setSecureSessionCookie(res, result.token);
      if (result.refreshToken) {
        setSecureRefreshCookie(res, result.refreshToken);
      }

      // Return user data and CSRF token (exclude sensitive token from response body)
      res.status(201).json({
        success: true,
        user: result.user,
        csrfToken: res.locals.csrfToken,
        message: 'User registered successfully'
      });
    } catch (error: any) {
      // Handle duplicate email error
      if (error.message.includes('duplicate key') || error.message.includes('already exists')) {
        res.status(409).json({ 
          success: false,
          message: 'Email already in use' 
        });
        return;
      }

      // Handle other errors
      res.status(500).json({ 
        success: false,
        message: error.message || 'Error registering user' 
      });
    }
  }

  /**
   * Login a user
   * @param req Express request
   * @param res Express response
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Extract login data from request body
      const loginData: UserLoginDTO = {
        email: req.body.email,
        password: req.body.password
      };

      // Login user
      const result = await authService.login(loginData);

      // Clear failed attempts on successful login
      if (req.bruteForceIdentifier) {
        clearFailedAttempts(req.bruteForceIdentifier);
      }

      // Set secure cookies for tokens
      setSecureSessionCookie(res, result.token);
      if (result.refreshToken) {
        setSecureRefreshCookie(res, result.refreshToken);
      }

      // Return user data and CSRF token (exclude sensitive token from response body)
      res.status(200).json({
        success: true,
        user: result.user,
        csrfToken: res.locals.csrfToken,
        message: 'Login successful'
      });
    } catch (error: any) {
      // Track failed login attempt
      if (req.bruteForceIdentifier) {
        trackFailedAttempt(req.bruteForceIdentifier);
      }

      // Handle invalid credentials
      if (error.message === 'Invalid email or password' || error.message === 'Invalid credentials') {
        res.status(401).json({ 
          success: false,
          message: 'Invalid email or password' 
        });
        return;
      }

      // Handle other errors
      res.status(500).json({ 
        success: false,
        message: 'Error logging in' 
      });
    }
  }

  /**
   * Refresh user token
   * @param req Express request
   * @param res Express response
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies?.refreshToken;
      
      if (!refreshToken) {
        res.status(401).json({ 
          success: false,
          message: 'Refresh token required' 
        });
        return;
      }

      // Refresh token
      const result = await authService.refreshToken(refreshToken);

      // Set new secure cookies
      setSecureSessionCookie(res, result.token);
      if (result.refreshToken) {
        setSecureRefreshCookie(res, result.refreshToken);
      }

      // Return success response
      res.status(200).json({
        success: true,
        user: result.user,
        csrfToken: res.locals.csrfToken,
        message: 'Token refreshed successfully'
      });
    } catch (error: any) {
      // Clear invalid cookies
      clearAuthCookies(res);

      // Handle user not found or invalid token
      if (error.message === 'User not found' || error.message === 'Invalid refresh token') {
        res.status(401).json({ 
          success: false,
          message: 'Invalid or expired refresh token' 
        });
        return;
      }

      // Handle other errors
      res.status(500).json({ 
        success: false,
        message: 'Error refreshing token' 
      });
    }
  }

  /**
   * Logout user
   * @param req Express request
   * @param res Express response
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Clear authentication cookies
      clearAuthCookies(res);

      // Return success response
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: 'Error logging out' 
      });
    }
  }
}

// Export singleton instance
export const authController = new AuthController();