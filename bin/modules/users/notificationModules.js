const logger = require('../../helpers/utils/logger');
const config = require('../../config');
const MongoDb = require('../../config/database/mongodb/db');
const mongoDb = new MongoDb(config.get('/mongoDbUrl'));
// const { User } = require('../../models');
const authModules = require('./authModules');
const { NotFoundError, InternalServerError, ConflictError } = require('../../helpers/error');
const { Expo } = require('expo-server-sdk');
const { ObjectId } = require('mongodb');
const expo = new Expo();
const { PocketMember } = require('../../models');
const { Op } = require('sequelize');
const redis = require('../../config/redis');

module.exports.registerPushToken = async (notifData) => {
  try {
    mongoDb.setCollection('usersToken');

    const recordSet = await mongoDb.findOne({ userId: Number(notifData.userId) });
    if (recordSet.data && recordSet.data?.expoPushToken === notifData.expoPushToken) {
      return {
        result: recordSet.data,
        message: "Push token already registered"
      }
    }

    if (recordSet.data && recordSet.data?.expoPushToken !== notifData.expoPushToken) {
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

module.exports.setNotificationData = ({ pushToken, title, body, data = null }) => {
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

    // Invalidate cache for all unique user_ids in messages
    const userIds = new Set();
    messages.forEach(msg => {
      const userId = msg?.data?.user_id;
      if (userId) userIds.add(userId);
    });

    for (const userId of userIds) {
      await redis.del(`allNotif:${userId}`);
    }
  } catch (error) {
    logger.error(error);
    throw new InternalServerError(error.message);
  }
}

module.exports.getPushToken = async (userId) => {
  mongoDb.setCollection('usersToken');
  const pushEntry = await mongoDb.findOne({ userId: Number(userId) });
  if (!pushEntry.data?.expoPushToken) {
    throw new ConflictError('No push token registered')
  }

  return pushEntry.data.expoPushToken;
}

module.exports.getAllNotif = async (notifData) => {
  try {
    const cacheKey = `allNotif:${notifData.userId}`
    const cache = await redis.get(cacheKey);
    if (cache) {
      try {
        return JSON.parse(cache);
      } catch (error) {
        logger.error(`Failed to parse cache for key ${cacheKey}`, err);
        await redis.del(cacheKey);
      }
    }
    mongoDb.setCollection('notifications');
    const notif = await mongoDb.findMany({
      'data.user_id': Number(notifData.userId)
    }, {
      'data.date': -1
    })

    await redis.set(cacheKey, JSON.stringify(notif.data), 'EX', 180);

    if (!notif.data) {
      return [];
    }

    return notif.data;
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

module.exports.getDetailNotif = async (notifData) => {
  try {
    mongoDb.setCollection('notifications');
    const notif = await mongoDb.findOne({
      _id: new ObjectId(notifData.notifId),
      'data.user_id': Number(notifData.userId),
    })
    logger.info(notif);
    logger.info(notifData)

    if (!notif.data) {
      throw new NotFoundError('Notification not found');
    }

    return notif.data;
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

module.exports.sendInformationNotif = async ({ title, body, message, user_id }) => {
  try {
    // Send notification will be here
    const notifData = {
      date: new Date(),
      type: 'information',
      message,
      user_id
    }
    const pushToken = await this.getPushToken(user_id);
    const notifMessage = this.setNotificationData({
      pushToken,
      title,
      body,
      data: notifData
    })

    await this.pushNotification(notifMessage);

    mongoDb.setCollection('notifications');
    await mongoDb.insertOne(notifMessage[0]);
    const cacheKey = `allNotif:${user_id}`
    await redis.del(cacheKey);

    logger.info('Send notification success');
    return;
  } catch (error) {
    logger.error('Notification failed to send', error);
  }
}

module.exports.notifyPocketMembers = async ({
  pocketId,
  excludeUserId = null,
  targetUserId = null,
  title,
  body,
  message,
  transaction = null,
}) => {
  try {
    const whereClause = {
      pocket_id: pocketId,
    };

    // If sending to one specific user only
    if (targetUserId) {
      whereClause.user_id = targetUserId;
    } else if (excludeUserId) {
      // If excluding a specific user
      whereClause.user_id = { [Op.ne]: excludeUserId };
    }

    const membersToNotify = await PocketMember.findAll({
      where: whereClause,
      transaction,
    });

    await Promise.all(
      membersToNotify.map((member) =>
        this.sendInformationNotif({
          title,
          body,
          message,
          user_id: member.user_id,
        })
      )
    );
  } catch (err) {
    console.warn('Failed to notify pocket members:', err.message);
  }
};