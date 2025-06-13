const express = require('express');
const pocketController = require('../controllers/pocketControllers');
const userAuth = require('../middlewares/userAuth');

const router = express.Router();

// Route create pocket
router.post('/add', pocketController.addPocket);

// Route get all pockets
router.get('/', userAuth.authenticateToken(), pocketController.getAllPockets);

module.exports = router;