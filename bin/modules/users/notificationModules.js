const logger = require('../../helpers/utils/logger');
const config = require('../../config');
const MongoDb = require('../../config/database/mongodb/db');
const mongoDb = new MongoDb(config.get('/mongoDbUrl'));
// const { User } = require('../../models');
const authModules = require('./authModules');
const { NotFoundError, InternalServerError } = require('../../helpers/error');

module.exports.registerPushToken = async (notifData) => {
  try {
    mongoDb.setCollection('usersToken');

    const recordSet = await mongoDb.findOne(notifData);
    if (recordSet && recordSet.data?.expoPushToken === notifData.expoPushToken) {
      return {
        recordSet,
        message: "Push token already registered"
      }
    }

    const userData = await authModules.detailUser({id: notifData.userId});

    if (!userData) {
      logger.error('User not found while registering push token');
      throw new NotFoundError('User not found');
    }

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