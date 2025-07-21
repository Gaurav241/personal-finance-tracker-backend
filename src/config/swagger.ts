const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Personal Finance Tracker API',
      version: '1.0.0',
      description: 'A comprehensive API for managing personal finances with role-based access control, transaction management, and analytics.',
      contact: {
        name: 'API Support',
        email: 'support@personalfinancetracker.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.personalfinancetracker.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication'
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-CSRF-Token',
          description: 'CSRF token for security'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'read-only'],
              description: 'User role determining access permissions'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          },
          required: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt']
        },
        CreateUser: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (minimum 8 characters)'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'read-only'],
              description: 'User role (defaults to "user")'
            }
          },
          required: ['email', 'password', 'firstName', 'lastName']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          },
          required: ['email', 'password']
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User'
            },
            token: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            }
          },
          required: ['user', 'token']
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique transaction identifier'
            },
            userId: {
              type: 'integer',
              description: 'ID of the user who owns this transaction'
            },
            categoryId: {
              type: 'integer',
              nullable: true,
              description: 'ID of the transaction category'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Transaction amount'
            },
            description: {
              type: 'string',
              description: 'Transaction description'
            },
            transactionDate: {
              type: 'string',
              format: 'date',
              description: 'Date when the transaction occurred'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Transaction type'
            },
            category: {
              $ref: '#/components/schemas/Category'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction creation timestamp'
            }
          },
          required: ['id', 'userId', 'amount', 'description', 'transactionDate', 'type', 'createdAt']
        },
        CreateTransaction: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'integer',
              nullable: true,
              description: 'ID of the transaction category'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              minimum: 0.01,
              description: 'Transaction amount (must be positive)'
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Transaction description'
            },
            transactionDate: {
              type: 'string',
              format: 'date',
              description: 'Date when the transaction occurred'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Transaction type'
            }
          },
          required: ['amount', 'description', 'transactionDate', 'type']
        },
        UpdateTransaction: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'integer',
              nullable: true,
              description: 'ID of the transaction category'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              minimum: 0.01,
              description: 'Transaction amount (must be positive)'
            },
            description: {
              type: 'string',
              maxLength: 500,
              description: 'Transaction description'
            },
            transactionDate: {
              type: 'string',
              format: 'date',
              description: 'Date when the transaction occurred'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Transaction type'
            }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique category identifier'
            },
            name: {
              type: 'string',
              description: 'Category name'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Category type'
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              description: 'Category color in hex format'
            },
            icon: {
              type: 'string',
              description: 'Category icon identifier'
            }
          },
          required: ['id', 'name', 'type', 'color', 'icon']
        },
        CreateCategory: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 100,
              description: 'Category name'
            },
            type: {
              type: 'string',
              enum: ['income', 'expense'],
              description: 'Category type'
            },
            color: {
              type: 'string',
              pattern: '^#[0-9A-Fa-f]{6}$',
              description: 'Category color in hex format'
            },
            icon: {
              type: 'string',
              maxLength: 50,
              description: 'Category icon identifier'
            }
          },
          required: ['name', 'type', 'color', 'icon']
        },
        AnalyticsSummary: {
          type: 'object',
          properties: {
            totalIncome: {
              type: 'number',
              format: 'decimal',
              description: 'Total income for the period'
            },
            totalExpenses: {
              type: 'number',
              format: 'decimal',
              description: 'Total expenses for the period'
            },
            netIncome: {
              type: 'number',
              format: 'decimal',
              description: 'Net income (income - expenses)'
            },
            transactionCount: {
              type: 'integer',
              description: 'Total number of transactions'
            },
            averageTransaction: {
              type: 'number',
              format: 'decimal',
              description: 'Average transaction amount'
            },
            period: {
              type: 'object',
              properties: {
                startDate: {
                  type: 'string',
                  format: 'date',
                  description: 'Period start date'
                },
                endDate: {
                  type: 'string',
                  format: 'date',
                  description: 'Period end date'
                }
              }
            }
          }
        },
        CategoryBreakdown: {
          type: 'object',
          properties: {
            categoryId: {
              type: 'integer',
              description: 'Category ID'
            },
            categoryName: {
              type: 'string',
              description: 'Category name'
            },
            amount: {
              type: 'number',
              format: 'decimal',
              description: 'Total amount for this category'
            },
            percentage: {
              type: 'number',
              format: 'decimal',
              description: 'Percentage of total spending'
            },
            transactionCount: {
              type: 'integer',
              description: 'Number of transactions in this category'
            }
          }
        },
        MonthlyTrend: {
          type: 'object',
          properties: {
            month: {
              type: 'string',
              description: 'Month in YYYY-MM format'
            },
            income: {
              type: 'number',
              format: 'decimal',
              description: 'Total income for the month'
            },
            expenses: {
              type: 'number',
              format: 'decimal',
              description: 'Total expenses for the month'
            },
            net: {
              type: 'number',
              format: 'decimal',
              description: 'Net income for the month'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          },
          required: ['error']
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name with validation error'
                  },
                  message: {
                    type: 'string',
                    description: 'Validation error message'
                  }
                }
              }
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'Array of data items'
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'Current page number'
                },
                limit: {
                  type: 'integer',
                  description: 'Items per page'
                },
                total: {
                  type: 'integer',
                  description: 'Total number of items'
                },
                totalPages: {
                  type: 'integer',
                  description: 'Total number of pages'
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Authentication required'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Insufficient permissions'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationError'
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Too many requests, please try again later'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Internal server error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/docs/*.yaml'
  ]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Personal Finance Tracker API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true
    }
  }));

  // Serve the raw OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;