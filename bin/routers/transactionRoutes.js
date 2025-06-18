const express = require('express');
const topupController = require('../controllers/transaction/topupController');
const userAuth = require('../middlewares/userAuth');

const router = express.Router();

// Top Up
router.post('/topup', userAuth.authenticateToken, topupController.initTopUp);

module.exports = router;