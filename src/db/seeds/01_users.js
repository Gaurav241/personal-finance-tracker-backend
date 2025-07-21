const bcrypt = require('bcryptjs');

/**
 * Seed file to create initial users
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Create hashed password
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const userPassword = await bcrypt.hash('user123', salt);
  const readOnlyPassword = await bcrypt.hash('readonly123', salt);
  
  // Insert seed entries
  await knex('users').insert([
    {
      email: 'admin@example.com',
      password: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
    },
    {
      email: 'user@example.com',
      password: userPassword,
      first_name: 'Regular',
      last_name: 'User',
      role: 'user',
    },
    {
      email: 'readonly@example.com',
      password: readOnlyPassword,
      first_name: 'ReadOnly',
      last_name: 'User',
      role: 'read-only',
    },
  ]);
};