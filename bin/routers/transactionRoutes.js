const express = require('express');
const transactionController = require('../controllers/transaction/transactionController');
const userAuth = require('../middlewares/userAuth');

const router = express.Router();

// Top Up
router.post('/topup', userAuth.authenticateToken, transactionController.initTopUp);

// Withdrawal
router.post('/withdraw', userAuth.authenticateToken, transactionController.initWithdraw);

// AutoBudget
router.post('/set-auto-budget/:pocketId', userAuth.authenticateToken, transactionController.setAutoBudget);

module.exports = router;