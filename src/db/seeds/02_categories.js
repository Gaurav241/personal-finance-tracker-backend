/**
 * Seed file to create initial categories
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('categories').del();
  
  // Insert seed entries
  await knex('categories').insert([
    // Income categories
    { name: 'Salary', type: 'income', color: '#4CAF50', icon: 'work' },
    { name: 'Freelance', type: 'income', color: '#8BC34A', icon: 'computer' },
    { name: 'Investments', type: 'income', color: '#009688', icon: 'trending_up' },
    { name: 'Gifts', type: 'income', color: '#E91E63', icon: 'card_giftcard' },
    { name: 'Other Income', type: 'income', color: '#9C27B0', icon: 'attach_money' },
    
    // Expense categories
    { name: 'Housing', type: 'expense', color: '#F44336', icon: 'home' },
    { name: 'Food', type: 'expense', color: '#FF9800', icon: 'restaurant' },
    { name: 'Transportation', type: 'expense', color: '#2196F3', icon: 'directions_car' },
    { name: 'Utilities', type: 'expense', color: '#607D8B', icon: 'power' },
    { name: 'Entertainment', type: 'expense', color: '#673AB7', icon: 'movie' },
    { name: 'Shopping', type: 'expense', color: '#FFC107', icon: 'shopping_cart' },
    { name: 'Healthcare', type: 'expense', color: '#00BCD4', icon: 'local_hospital' },
    { name: 'Education', type: 'expense', color: '#3F51B5', icon: 'school' },
    { name: 'Personal Care', type: 'expense', color: '#795548', icon: 'spa' },
    { name: 'Travel', type: 'expense', color: '#CDDC39', icon: 'flight' },
    { name: 'Debt Payments', type: 'expense', color: '#FF5722', icon: 'account_balance' },
    { name: 'Other Expenses', type: 'expense', color: '#9E9E9E', icon: 'more_horiz' },
  ]);
};