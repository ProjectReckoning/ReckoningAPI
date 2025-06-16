const express = require('express');
const authController = require('../controllers/users/authController');
const otpController = require('../controllers/users/otpController');
const notificationController = require('../controllers/users/notificationController');
const validateRegisterInput = require('../middlewares/validator/registerValidator');
const userAuth = require('../middlewares/userAuth');

const router = express.Router();

// Register route
router.post('/register', validateRegisterInput, authController.register);

// Login route
router.post('/login', authController.login);

// Profile route
router.get('/me', userAuth.authenticateToken, authController.userProfile);

// OTP/Notification route
router.post('/register-push-token', userAuth.authenticateToken, notificationController.registerPushToken);
router.post('/login/request-otp', otpController.requestOtp);
router.post('/login/verify-otp', otpController.verifyOtp);

module.exports = router;