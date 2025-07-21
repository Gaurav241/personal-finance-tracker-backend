/**
 * User role type
 */
export type UserRole = 'admin' | 'user' | 'read-only';

/**
 * User model interface with full user data including password
 */
export interface User {
  id: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Data Transfer Object without sensitive information (password)
 */
export interface UserDTO {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
}

/**
 * Data required to create a new user
 */
export interface CreateUserDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * Data required for user authentication
 */
export interface UserLoginDTO {
  email: string;
  password: string;
}

/**
 * User authentication result
 */
export interface AuthResult {
  user: UserDTO;
  token: string;
  refreshToken?: string;
}

/**
 * Token refresh result
 */
export interface RefreshResult {
  user: UserDTO;
  token: string;
  refreshToken?: string;
}