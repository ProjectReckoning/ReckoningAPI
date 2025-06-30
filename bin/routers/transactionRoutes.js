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
router.get('/auto-budget/:pocketId', userAuth.authenticateToken, transactionController.getAutoBudget);
router.delete('/auto-budget/:pocketId', userAuth.authenticateToken, transactionController.deleteAutoBudget)

// Payment (Transfer only, for demo purpose)
router.post('/transfer', userAuth.authenticateToken, transactionController.initTransfer);
router.patch('/transfer/:transactionId', userAuth.authenticateToken, transactionController.respondTransfer);

// Scheduled transfer
router.post('/transfer/schedule', userAuth.authenticateToken, transactionController.setTransferSchedule);
router.get('/transfer/schedule/:pocketId', userAuth.authenticateToken, transactionController.getTransferSchedule);
router.get('/transfer/schedule/:pocketId/:scheduleId', userAuth.authenticateToken, transactionController.getDetailTransferSchedule);
router.delete('/transfer/schedule/:pocketId/:scheduleId', userAuth.authenticateToken, transactionController.deleteTransferSchedule);

module.exports = router;