"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = __importDefault(require("../controllers/transaction.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
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
router.use(auth_middleware_1.authenticateToken);
// GET /api/v1/transactions - Get all transactions for the authenticated user
// All roles can access this endpoint (admin, user, read-only)
router.get('/', (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), transaction_controller_1.default.getUserTransactions);
// GET /api/v1/transactions/:id - Get a specific transaction by ID
// All roles can access this endpoint (admin, user, read-only)
router.get('/:id', (0, auth_middleware_1.authorizeRole)(['admin', 'user', 'read-only']), transaction_controller_1.default.getTransactionById);
// POST /api/v1/transactions - Create a new transaction
// Only admin and user roles can create transactions
router.post('/', (0, auth_middleware_1.authorizeRole)(['admin', 'user']), auth_middleware_1.authorizeWriteAccess, transaction_controller_1.default.createTransaction);
// PUT /api/v1/transactions/:id - Update an existing transaction
// Only admin and user roles can update transactions
router.put('/:id', (0, auth_middleware_1.authorizeRole)(['admin', 'user']), auth_middleware_1.authorizeWriteAccess, transaction_controller_1.default.updateTransaction);
// DELETE /api/v1/transactions/:id - Delete a transaction
// Only admin and user roles can delete transactions
router.delete('/:id', (0, auth_middleware_1.authorizeRole)(['admin', 'user']), auth_middleware_1.authorizeWriteAccess, transaction_controller_1.default.deleteTransaction);
exports.default = router;
