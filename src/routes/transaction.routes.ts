import { Router } from 'express';
import TransactionController from '../controllers/transaction.controller';
import { 
  authenticateToken, 
  authorizeRole, 
  authorizeWriteAccess 
} from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';
import {
  validateTransactionCreate,
  validateTransactionUpdate,
  validateTransactionId,
  validateTransactionQuery
} from '../middleware/validation.middleware';

const router = Router();

/**
 * Transaction routes with role-based access control
 * Implements requirements:
 * - 2.1: "WHEN user with 'admin' or 'user' role creates a transaction THEN the system SHALL save it with category, amount, date, and description"
 * - 2.2: "WHEN user with 'admin' or 'user' role edits a transaction THEN the system SHALL update the record and invalidate related cache"
 * - 2.3: "WHEN user with 'admin' or 'user' role deletes a transaction THEN the system SHALL remove it from database and update analytics"
 * - 2.4: "WHEN user searches transactions THEN the system SHALL return filtered results based on search criteria"
 * - 2.5: "WHEN user filters by category THEN the system SHALL display only transactions matching selected categories"
 * - 2.6: "WHEN user with 'read-only' role accesses transactions THEN the system SHALL display view-only interface without edit/delete options"
 * - 2.7: "WHEN transaction list exceeds page limit THEN the system SHALL implement pagination for performance"
 * - 6.3: "WHEN 'user' role accesses transaction endpoints THEN the system SHALL filter data to show only their own records"
 */

// All routes require authentication
router.use(authenticateToken);

// GET /api/v1/transactions - Get all transactions for the authenticated user
// All roles can access this endpoint (admin, user, read-only)
router.get(
  '/',
  authorizeRole(['admin', 'user', 'read-only'] as UserRole[]),
  validateTransactionQuery,
  TransactionController.getUserTransactions
);

// GET /api/v1/transactions/:id - Get a specific transaction by ID
// All roles can access this endpoint (admin, user, read-only)
router.get(
  '/:id',
  authorizeRole(['admin', 'user', 'read-only'] as UserRole[]),
  validateTransactionId,
  TransactionController.getTransactionById
);

// POST /api/v1/transactions - Create a new transaction
// Only admin and user roles can create transactions
router.post(
  '/',
  authorizeRole(['admin', 'user'] as UserRole[]),
  authorizeWriteAccess,
  validateTransactionCreate,
  TransactionController.createTransaction
);

// PUT /api/v1/transactions/:id - Update an existing transaction
// Only admin and user roles can update transactions
router.put(
  '/:id',
  authorizeRole(['admin', 'user'] as UserRole[]),
  authorizeWriteAccess,
  validateTransactionUpdate,
  TransactionController.updateTransaction
);

// DELETE /api/v1/transactions/:id - Delete a transaction
// Only admin and user roles can delete transactions
router.delete(
  '/:id',
  authorizeRole(['admin', 'user'] as UserRole[]),
  authorizeWriteAccess,
  validateTransactionId,
  TransactionController.deleteTransaction
);

export default router;