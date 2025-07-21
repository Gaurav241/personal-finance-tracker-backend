import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { validationResult } from 'express-validator';
import db from '../services/db.service';

/**
 * User controller for handling user-related requests
 */
export class UserController {
  /**
   * Get all users (admin only)
   * @param req Express request
   * @param res Express response
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      // Get all users from database
      const users = await db.select(['id', 'email', 'first_name', 'last_name', 'role', 'created_at'])
        .from('users')
        .orderBy('id');

      // Map to UserDTO format
      const formattedUsers = users.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        createdAt: user.created_at
      }));

      res.status(200).json(formattedUsers);
    } catch (error: any) {
      console.error('Error getting all users:', error);
      res.status(500).json({ message: 'Error retrieving users' });
    }
  }

  /**
   * Get user by ID
   * @param req Express request
   * @param res Express response
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);

      // Get user by ID
      const user = await userService.getUserById(userId);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      console.error('Error getting user by ID:', error);
      res.status(500).json({ message: 'Error retrieving user' });
    }
  }

  /**
   * Update user
   * @param req Express request
   * @param res Express response
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await userService.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Prepare update data
      const updateData: Record<string, any> = {};
      
      // Only update fields that are provided
      if (req.body.firstName) updateData.first_name = req.body.firstName;
      if (req.body.lastName) updateData.last_name = req.body.lastName;
      
      // Only admin can update roles
      if (req.body.role && req.user?.role === 'admin') {
        updateData.role = req.body.role;
      }

      // Update user in database
      const [updatedUser] = await db.update({
          ...updateData,
          updated_at: new Date()
        })
        .from('users')
        .where({ id: userId })
        .returning(['id', 'email', 'first_name', 'last_name', 'role', 'created_at']);

      // Return updated user
      res.status(200).json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role,
        createdAt: updatedUser.created_at
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Error updating user' });
    }
  }

  /**
   * Delete user
   * @param req Express request
   * @param res Express response
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await userService.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Delete user from database
      await db.from('users').where({ id: userId }).delete();

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Error deleting user' });
    }
  }
}

// Export singleton instance
export const userController = new UserController();