const express = require('express');
const authController = require('../controllers/users/authController');
const validateRegisterInput = require('../middlewares/validator/registerValidator');

const router = express.Router();

// Register route
router.post('/register', validateRegisterInput, authController.register);

// Login route
router.post('/login', authController.login);

module.exports = router;