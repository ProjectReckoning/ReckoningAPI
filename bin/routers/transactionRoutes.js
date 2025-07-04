const express = require('express');
const transactionController = require('../controllers/transaction/transactionController');
const userAuth = require('../middlewares/userAuth');
const { runAutoBudgetJob } = require('../modules/transaction/autoBudgetModules');

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

// FOR DEMO PURPOSE
router.get('/run-all-cron-job', (req, res) => {
  // if (req.user.role !== 'admin') {
  //   return res.status(403).json({ message: 'Forbidden' });
  // }
  runAutoBudgetJob()
    .then(() => res.status(200).json({ message: 'Cron job executed' }))
    .catch(err => res.status(500).json({ message: 'Error running cron job', error: err.message }));
});

module.exports = router;