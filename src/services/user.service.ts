import bcrypt from 'bcryptjs';
import knex from './db.service';
import { User, UserDTO, CreateUserDTO } from '../models/user.model';

/**
 * User service for handling user-related operations
 */
export class UserService {
  /**
   * Create a new user with hashed password
   * @param userData User data to create
   * @returns Created user without password
   */
  async createUser(userData: CreateUserDTO): Promise<UserDTO> {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Insert user with hashed password
    const [user] = await knex('users')
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
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify user password
   * @param plainPassword Plain text password
   * @param hashedPassword Hashed password from database
   * @returns Boolean indicating if password matches
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user by email
   * @param email User email
   * @returns User with password for authentication
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await knex('users').where({ email }).first();
    
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      password: user.password,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role as 'admin' | 'user' | 'read-only',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * Get user by ID
   * @param id User ID
   * @returns User without password
   */
  async getUserById(id: number): Promise<UserDTO | null> {
    const user = await knex('users').where({ id }).first();
    
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
  private mapToUserDTO(dbUser: any): UserDTO {
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

// Export singleton instance
export const userService = new UserService();