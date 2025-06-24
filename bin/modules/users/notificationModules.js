const logger = require('../../helpers/utils/logger');
const config = require('../../config');
const MongoDb = require('../../config/database/mongodb/db');
const mongoDb = new MongoDb(config.get('/mongoDbUrl'));
// const { User } = require('../../models');
const authModules = require('./authModules');
const { NotFoundError, InternalServerError } = require('../../helpers/error');
const { Expo } = require('expo-server-sdk');
const { ObjectId } = require('mongodb');
const expo = new Expo();

module.exports.registerPushToken = async (notifData) => {
  try {
    mongoDb.setCollection('usersToken');

    const recordSet = await mongoDb.findOne({ userId: notifData.userId });
    if (recordSet && recordSet.data?.expoPushToken === notifData.expoPushToken) {
      return {
        result: recordSet.data,
        message: "Push token already registered"
      }
    }

    if (recordSet && recordSet.data?.expoPushToken !== notifData.expoPushToken) {
      const result = await mongoDb.upsertOne({
        _id: new ObjectId(recordSet.data._id)
      }, {
        $set: { expoPushToken: notifData.expoPushToken }
      })

      return {
        result: result.data,
        message: 'Push token succesfully updated'
      }
    }

    const userData = await authModules.detailUser({ id: notifData.userId });

    if (!userData) {
      logger.error('User not found while registering push token');
      throw new NotFoundError('User not found');
    }

    notifData.timestamp = new Date();

    const result = await mongoDb.insertOne(notifData);

    return {
      result: result.data,
      message: 'Push token succesfully registered'
    };
  } catch (error) {
    logger.error(error);
    if (
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.setNotificationData = async ({ pushToken, title, body, data = null }) => {
  const messages = [{
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  }];
  return messages;
}

module.exports.pushNotification = async (messages) => {
  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (error) {
    logger.error(error);
    throw new InternalServerError(error.message);
  }
}

module.exports.getPushToken = async (userId) => {
  mongoDb.setCollection('usersToken');
  const pushEntry = await mongoDb.findOne({ userId: userId });
  if (!pushEntry?.expoPushToken) {
    throw new ConflictError('No push token registered')
  }

  return pushEntry.expoPushToken;
}