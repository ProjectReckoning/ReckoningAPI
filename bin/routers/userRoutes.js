const express = require('express');
const authController = require('../controllers/users/authController');
const validateRegisterInput = require('../middlewares/validator/registerValidator');
const userAuth = require('../middlewares/userAuth');

const router = express.Router();

// Register route
router.post('/register', validateRegisterInput, authController.register);

// Login route
router.post('/login', authController.login);

// Profile route
router.get('/me', userAuth.authenticateToken(), authController.userProfile);

module.exports = router;