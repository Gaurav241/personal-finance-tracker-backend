/**
 * Migration to create categories table
 */
exports.up = function(knex) {
  return knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.enum('type', ['income', 'expense']).notNullable();
    table.string('color', 7); // Hex color code
    table.string('icon', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('categories');
};