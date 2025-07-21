/**
 * Migration to create transactions table
 */
exports.up = function(knex) {
  return knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('category_id').unsigned();
    table.decimal('amount', 12, 2).notNullable();
    table.text('description');
    table.date('transaction_date').notNullable();
    table.enum('type', ['income', 'expense']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('category_id').references('id').inTable('categories').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('transactions');
};