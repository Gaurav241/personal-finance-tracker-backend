"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_service_1 = __importDefault(require("./db.service"));
/**
 * User service for handling user-related operations
 */
class UserService {
    /**
     * Create a new user with hashed password
     * @param userData User data to create
     * @returns Created user without password
     */
    async createUser(userData) {
        // Hash the password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, salt);
        // Insert user with hashed password
        const [user] = await (0, db_service_1.default)('users')
            .insert({
            email: userData.email,
            password: hashedPassword,
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || 'user', // Default to 'user' if not specified
        })
            .returning(['id', 'email', 'first_name', 'last_name', 'role', 'created_at']);
        // Return user without password
        return this.mapToUserDTO(user);
    }
    /**
     * Hash a password
     * @param password Plain text password
     * @returns Hashed password
     */
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    /**
     * Verify user password
     * @param plainPassword Plain text password
     * @param hashedPassword Hashed password from database
     * @returns Boolean indicating if password matches
     */
    async verifyPassword(plainPassword, hashedPassword) {
        return bcryptjs_1.default.compare(plainPassword, hashedPassword);
    }
    /**
     * Get user by email
     * @param email User email
     * @returns User with password for authentication
     */
    async getUserByEmail(email) {
        const user = await (0, db_service_1.default)('users').where({ email }).first();
        if (!user) {
            return null;
        }
        return {
            id: user.id,
            email: user.email,
            password: user.password,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
    }
    /**
     * Get user by ID
     * @param id User ID
     * @returns User without password
     */
    async getUserById(id) {
        const user = await (0, db_service_1.default)('users').where({ id }).first();
        if (!user) {
            return null;
        }
        return this.mapToUserDTO(user);
    }
    /**
     * Map database user to UserDTO (without password)
     * @param dbUser User from database
     * @returns User DTO without password
     */
    mapToUserDTO(dbUser) {
        return {
            id: dbUser.id,
            email: dbUser.email,
            firstName: dbUser.first_name,
            lastName: dbUser.last_name,
            role: dbUser.role,
            createdAt: dbUser.created_at,
        };
    }
}
exports.UserService = UserService;
// Export singleton instance
exports.userService = new UserService();
