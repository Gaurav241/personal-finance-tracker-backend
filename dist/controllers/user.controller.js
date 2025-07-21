"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const express_validator_1 = require("express-validator");
const db_service_1 = __importDefault(require("../services/db.service"));
/**
 * User controller for handling user-related requests
 */
class UserController {
    /**
     * Get all users (admin only)
     * @param req Express request
     * @param res Express response
     */
    async getAllUsers(req, res) {
        try {
            // Get all users from database
            const users = await db_service_1.default.select(['id', 'email', 'first_name', 'last_name', 'role', 'created_at'])
                .from('users')
                .orderBy('id');
            // Map to UserDTO format
            const formattedUsers = users.map((user) => ({
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                createdAt: user.created_at
            }));
            res.status(200).json(formattedUsers);
        }
        catch (error) {
            console.error('Error getting all users:', error);
            res.status(500).json({ message: 'Error retrieving users' });
        }
    }
    /**
     * Get user by ID
     * @param req Express request
     * @param res Express response
     */
    async getUserById(req, res) {
        try {
            const userId = parseInt(req.params.id);
            // Get user by ID
            const user = await user_service_1.userService.getUserById(userId);
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.status(200).json(user);
        }
        catch (error) {
            console.error('Error getting user by ID:', error);
            res.status(500).json({ message: 'Error retrieving user' });
        }
    }
    /**
     * Update user
     * @param req Express request
     * @param res Express response
     */
    async updateUser(req, res) {
        try {
            // Check for validation errors
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({ errors: errors.array() });
                return;
            }
            const userId = parseInt(req.params.id);
            // Check if user exists
            const existingUser = await user_service_1.userService.getUserById(userId);
            if (!existingUser) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            // Prepare update data
            const updateData = {};
            // Only update fields that are provided
            if (req.body.firstName)
                updateData.first_name = req.body.firstName;
            if (req.body.lastName)
                updateData.last_name = req.body.lastName;
            // Only admin can update roles
            if (req.body.role && req.user?.role === 'admin') {
                updateData.role = req.body.role;
            }
            // Update user in database
            const [updatedUser] = await db_service_1.default.update({
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
        }
        catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: 'Error updating user' });
        }
    }
    /**
     * Change user password
     * @param req Express request
     * @param res Express response
     */
    async changePassword(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { currentPassword, newPassword } = req.body;
            // Check if user exists and get full user data with password
            const existingUser = await db_service_1.default.from('users').where({ id: userId }).first();
            if (!existingUser) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            // Verify current password
            const isCurrentPasswordValid = await user_service_1.userService.verifyPassword(currentPassword, existingUser.password);
            if (!isCurrentPasswordValid) {
                res.status(400).json({ message: 'Current password is incorrect' });
                return;
            }
            // Hash new password
            const hashedNewPassword = await user_service_1.userService.hashPassword(newPassword);
            // Update password in database
            await db_service_1.default.from('users')
                .where({ id: userId })
                .update({
                password: hashedNewPassword,
                updated_at: new Date()
            });
            res.status(200).json({ message: 'Password changed successfully' });
        }
        catch (error) {
            console.error('Error changing password:', error);
            res.status(500).json({ message: 'Error changing password' });
        }
    }
    /**
     * Delete user
     * @param req Express request
     * @param res Express response
     */
    async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            // Check if user exists
            const existingUser = await user_service_1.userService.getUserById(userId);
            if (!existingUser) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            // Delete user from database
            await db_service_1.default.from('users').where({ id: userId }).delete();
            res.status(200).json({ message: 'User deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Error deleting user' });
        }
    }
}
exports.UserController = UserController;
// Export singleton instance
exports.userController = new UserController();
