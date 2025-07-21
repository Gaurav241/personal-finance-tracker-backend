# Personal Finance Tracker API Documentation

## Overview

The Personal Finance Tracker API is a comprehensive RESTful service for managing personal finances with role-based access control, transaction management, and analytics capabilities.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.personalfinancetracker.com`

## Interactive Documentation

- **Swagger UI**: `{BASE_URL}/api-docs`
- **OpenAPI Spec**: `{BASE_URL}/api-docs.json`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### CSRF Protection

For state-changing operations, include the CSRF token in the header:

```
X-CSRF-Token: <csrf-token>
```

## User Roles

The system supports three user roles with different permissions:

- **admin**: Full access to all features including user management
- **user**: Can manage their own transactions and view analytics
- **read-only**: View-only access to their own data

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **Transaction endpoints**: 100 requests per hour per user
- **Analytics endpoints**: 50 requests per hour per user
- **General API**: 1000 requests per hour per IP

## API Endpoints

### Authentication

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

### Users

#### Get All Users (Admin Only)
```http
GET /api/v1/users?page=1&limit=20&role=user&search=john
Authorization: Bearer <admin-token>
```

#### Get User by ID
```http
GET /api/v1/users/1
Authorization: Bearer <token>
```

#### Update User
```http
PUT /api/v1/users/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated@example.com"
}
```

#### Change Password
```http
PUT /api/v1/users/1/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword123",
  "confirmPassword": "newSecurePassword123"
}
```

#### Delete User (Admin Only)
```http
DELETE /api/v1/users/1
Authorization: Bearer <admin-token>
```

### Transactions

#### Get User Transactions
```http
GET /api/v1/transactions?page=1&limit=20&type=expense&categoryId=2&startDate=2024-01-01&endDate=2024-01-31&search=grocery&sortBy=transactionDate&sortOrder=desc
Authorization: Bearer <token>
```

#### Get Transaction by ID
```http
GET /api/v1/transactions/1
Authorization: Bearer <token>
```

#### Create Transaction
```http
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoryId": 2,
  "amount": 75.50,
  "description": "Grocery shopping",
  "transactionDate": "2024-01-15",
  "type": "expense"
}
```

#### Update Transaction
```http
PUT /api/v1/transactions/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 85.00,
  "description": "Updated grocery shopping",
  "categoryId": 3
}
```

#### Delete Transaction
```http
DELETE /api/v1/transactions/1
Authorization: Bearer <token>
```

### Categories

#### Get All Categories
```http
GET /api/v1/categories
```

#### Get Categories by Type
```http
GET /api/v1/categories/type/expense
```

#### Get Category by ID
```http
GET /api/v1/categories/1
```

#### Create Category (Admin Only)
```http
POST /api/v1/categories
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Entertainment",
  "type": "expense",
  "color": "#E74C3C",
  "icon": "film"
}
```

#### Update Category (Admin Only)
```http
PUT /api/v1/categories/1
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Category",
  "color": "#3498DB",
  "icon": "updated-icon"
}
```

#### Delete Category (Admin Only)
```http
DELETE /api/v1/categories/1
Authorization: Bearer <admin-token>
```

### Analytics

#### Get Analytics Summary
```http
GET /api/v1/analytics/summary?period=month&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### Get Monthly Trends
```http
GET /api/v1/analytics/trends/monthly?months=12
Authorization: Bearer <token>
```

#### Get Category Trends
```http
GET /api/v1/analytics/trends/category/2?months=6
Authorization: Bearer <token>
```

#### Get Category Breakdown
```http
GET /api/v1/analytics/breakdown/expense?period=month&limit=10
Authorization: Bearer <token>
```

#### Get Budget Comparison
```http
GET /api/v1/analytics/budget?month=2024-01
Authorization: Bearer <token>
```

#### Get Financial Insights
```http
GET /api/v1/analytics/insights?period=month
Authorization: Bearer <token>
```

## Response Formats

### Success Response
```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Paginated Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

## Data Models

### User
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Transaction
```json
{
  "id": 1,
  "userId": 1,
  "categoryId": 2,
  "amount": 75.50,
  "description": "Grocery shopping",
  "transactionDate": "2024-01-15",
  "type": "expense",
  "category": {
    "id": 2,
    "name": "Groceries",
    "type": "expense",
    "color": "#FF6B6B",
    "icon": "shopping-cart"
  },
  "createdAt": "2024-01-15T14:30:00Z"
}
```

### Category
```json
{
  "id": 1,
  "name": "Salary",
  "type": "income",
  "color": "#4ECDC4",
  "icon": "dollar-sign"
}
```

### Analytics Summary
```json
{
  "totalIncome": 5000.00,
  "totalExpenses": 3250.75,
  "netIncome": 1749.25,
  "transactionCount": 45,
  "averageTransaction": 183.37,
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions based on user roles
- **Rate Limiting**: Protection against API abuse
- **Input Validation**: Comprehensive request validation
- **CSRF Protection**: Cross-site request forgery prevention
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **Security Headers**: Comprehensive security headers via Helmet.js

## Caching Strategy

- **Analytics Data**: Cached for 15 minutes
- **Category Data**: Cached for 1 hour
- **User Sessions**: Managed via Redis
- **Cache Invalidation**: Automatic invalidation on data updates

## Error Handling

The API implements comprehensive error handling with:

- **Global Error Handler**: Catches and formats all errors
- **Validation Errors**: Detailed field-level validation messages
- **Authentication Errors**: Clear authentication failure messages
- **Authorization Errors**: Specific permission denial messages
- **Rate Limit Errors**: Clear rate limiting information

## Testing

The API includes comprehensive test coverage:

- **Unit Tests**: Service layer and utility functions
- **Integration Tests**: API endpoints and database operations
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load testing and optimization

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis 6+

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `npm run migrate`
5. Seed initial data: `npm run seed`
6. Start development server: `npm run dev`

### Environment Variables
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/finance_tracker
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=http://localhost:3000
```

## Support

For API support and questions:
- Email: support@personalfinancetracker.com
- Documentation: `/api-docs`
- GitHub Issues: [Repository Issues](https://github.com/your-repo/issues)