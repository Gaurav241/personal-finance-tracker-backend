# Personal Finance Tracker Backend

## Database Setup

### Prerequisites
- PostgreSQL installed and running
- Redis installed and running
- Node.js and npm installed

### Setup Instructions

1. Create a PostgreSQL database:
```bash
createdb finance_tracker
```

2. Copy the environment variables file:
```bash
cp .env.example .env
```

3. Update the `.env` file with your PostgreSQL and Redis credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_tracker
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_any
```

4. Install dependencies:
```bash
npm install
```

5. Run migrations to create database schema:
```bash
npm run migrate
```

6. Seed the database with initial data:
```bash
npm run seed
```

7. Start the development server:
```bash
npm run dev
```

## Database Management

### Migrations
- Create a new migration: `npm run migrate:make migration_name`
- Run migrations: `npm run migrate`
- Rollback migrations: `npm run migrate:rollback`

### Seeds
- Create a new seed file: `npm run seed:make seed_name`
- Run seed files: `npm run seed`

### Reset Database
- Reset database (rollback, migrate, seed): `npm run db:reset`

## Database Schema

### Users Table
- id: Primary key
- email: Unique email address
- password: Hashed password
- first_name: User's first name
- last_name: User's last name
- role: User role (admin, user, read-only)
- created_at: Timestamp of creation
- updated_at: Timestamp of last update

### Categories Table
- id: Primary key
- name: Category name
- type: Category type (income, expense)
- color: Hex color code for UI
- icon: Icon name for UI
- created_at: Timestamp of creation

### Transactions Table
- id: Primary key
- user_id: Foreign key to users table
- category_id: Foreign key to categories table
- amount: Transaction amount
- description: Transaction description
- transaction_date: Date of transaction
- type: Transaction type (income, expense)
- created_at: Timestamp of creation
- updated_at: Timestamp of last update
## Re
dis Caching

The application uses Redis for caching to improve performance. The following data types are cached:

- **Analytics Data**: Cached for 15 minutes
- **Category Data**: Cached for 1 hour
- **User Data**: Cached for 30 minutes
- **Transaction Lists**: Cached for 5 minutes

### Cache Invalidation

Cache is automatically invalidated when related data is updated:

- When a transaction is created, updated, or deleted, all analytics cache for that user is invalidated
- When categories are updated, the categories cache is invalidated

### Cache Keys

The cache service uses the following key patterns:

- Analytics: `analytics:{userId}:{period}`
- Categories: `categories` or `categories:{userId}`
- Transactions: `transactions:{userId}:{filters}`
- User: `user:{userId}`

### Example Usage

See `src/examples/cache-usage.example.ts` for examples of how to use the cache service in controllers.