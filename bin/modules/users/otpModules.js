const { InternalServerError, NotFoundError, UnauthorizedError, ConflictError, BadRequestError } = require("../../helpers/error");
const logger = require("../../helpers/utils/logger");
const authModules = require('./authModules');
const { User } = require('../../models');
const crypto = require('crypto');
const redis = require('../../config/redis');
const { Expo } = require('expo-server-sdk');
const expo = new Expo();
const config = require('../../config');
const MongoDb = require('../../config/database/mongodb/db');
const mongoDb = new MongoDb(config.get('/mongoDbUrl'));
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

module.exports.requestOtp = async (reqOtpData) => {
  try {
    const userData = await User.findOne({
      where: {
        phone_number: reqOtpData.phone_number
      }
    });

    if (!userData) {
      throw new NotFoundError('User not found');
    };

    const isMatch = await bcrypt.compare(reqOtpData.password, userData.password);

    if (!isMatch) {
      throw new UnauthorizedError('Wrong phone number / password');
    }

    const user = userData.get({ plain: true });
    delete user.password;

    // Generate OTP & sessionId using UUIDv4
    const otp = crypto.randomInt(100000, 999999).toString();
    const sessionId = uuidv4()

    // Save OTP to Redis (3 min expiry)
    await redis.set(`otp:${reqOtpData.phone_number}:${sessionId}`, otp, 'EX', 180);

    // Get push token
    mongoDb.setCollection('usersToken');
    const pushEntry = await mongoDb.findOne({ userId: user.id });
    if (!pushEntry.data?.expoPushToken) {
      throw new ConflictError('No push token registered')
    }

    // Send notification
    const messages = [{
      to: pushEntry.data.expoPushToken,
      sound: 'default',
      title: 'Your OTP Code to login in website',
      body: `Your OTP is ${otp}`,
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    return { 
      phone_number: reqOtpData.phone_number, 
      sessionId,
    };
  } catch (error) {
    logger.error(error);
    if (
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError ||
      error instanceof ConflictError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.verifyOtp = async (verifyOtpData) => {
  try {
    const storedOtp = await redis.get(`otp:${verifyOtpData.phone_number}:${verifyOtpData.sessionId}`);

    if (!storedOtp || storedOtp !== verifyOtpData.otp) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    // Generate token (e.g. JWT)
    const userData = await User.findOne({
      where: {
        phone_number: verifyOtpData.phone_number
      }
    });
    if (!userData) {
      throw new NotFoundError('User not found');
    }
    const user = userData.get({ plain: true });
    delete user.password;
    const token = await authModules.generateToken(user);

    // Clean up
    await redis.del(`otp:${verifyOtpData.phone_number}:${verifyOtpData.sessionId}`);

    return { token };
  } catch (error) {
    logger.error(error);
    if (
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}