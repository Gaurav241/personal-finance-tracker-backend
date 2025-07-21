/**
 * Migration to add performance indexes for frequently queried columns
 * Implements requirement 4.2, 5.5: Add indexes for frequently queried columns
 */
exports.up = function(knex) {
  return Promise.all([
    // Indexes for users table
    knex.schema.alterTable('users', (table) => {
      table.index('email', 'idx_users_email'); // For login queries
      table.index('role', 'idx_users_role'); // For role-based queries
      table.index('created_at', 'idx_users_created_at'); // For sorting/filtering by creation date
    }),
    
    // Indexes for transactions table
    knex.schema.alterTable('transactions', (table) => {
      table.index('user_id', 'idx_transactions_user_id'); // For user-specific queries
      table.index('category_id', 'idx_transactions_category_id'); // For category filtering
      table.index('transaction_date', 'idx_transactions_date'); // For date range queries
      table.index('type', 'idx_transactions_type'); // For income/expense filtering
      table.index(['user_id', 'transaction_date'], 'idx_transactions_user_date'); // Composite index for user + date queries
      table.index(['user_id', 'type'], 'idx_transactions_user_type'); // Composite index for user + type queries
      table.index(['user_id', 'category_id'], 'idx_transactions_user_category'); // Composite index for user + category queries
      table.index('created_at', 'idx_transactions_created_at'); // For sorting by creation time
      table.index('amount', 'idx_transactions_amount'); // For amount-based filtering
    }),
    
    // Indexes for categories table
    knex.schema.alterTable('categories', (table) => {
      table.index('type', 'idx_categories_type'); // For filtering by income/expense
      table.index('name', 'idx_categories_name'); // For searching by name
      table.index(['type', 'name'], 'idx_categories_type_name'); // Composite index for type + name queries
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    // Drop indexes for users table
    knex.schema.alterTable('users', (table) => {
      table.dropIndex('email', 'idx_users_email');
      table.dropIndex('role', 'idx_users_role');
      table.dropIndex('created_at', 'idx_users_created_at');
    }),
    
    // Drop indexes for transactions table
    knex.schema.alterTable('transactions', (table) => {
      table.dropIndex('user_id', 'idx_transactions_user_id');
      table.dropIndex('category_id', 'idx_transactions_category_id');
      table.dropIndex('transaction_date', 'idx_transactions_date');
      table.dropIndex('type', 'idx_transactions_type');
      table.dropIndex(['user_id', 'transaction_date'], 'idx_transactions_user_date');
      table.dropIndex(['user_id', 'type'], 'idx_transactions_user_type');
      table.dropIndex(['user_id', 'category_id'], 'idx_transactions_user_category');
      table.dropIndex('created_at', 'idx_transactions_created_at');
      table.dropIndex('amount', 'idx_transactions_amount');
    }),
    
    // Drop indexes for categories table
    knex.schema.alterTable('categories', (table) => {
      table.dropIndex('type', 'idx_categories_type');
      table.dropIndex('name', 'idx_categories_name');
      table.dropIndex(['type', 'name'], 'idx_categories_type_name');
    })
  ]);
};