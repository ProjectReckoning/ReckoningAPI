const logger = require('../../helpers/utils/logger');
const { InternalServerError, ConflictError, NotFoundError, UnauthorizedError } = require("../../helpers/error");
const bcrypt = require('bcrypt');
const config = require('../../config');
const SALT_ROUNDS = process.env.SALT_ROUNDS;
const { User, MockSavingsAccount, sequelize } = require('../../models');
const jwt = require('jsonwebtoken');
const { generateUniqueAccountNumber } = require('../pocket/pocketModules');
const redis = require('../../config/redis');

module.exports.generateToken = async (data) => {
  const token = jwt.sign(data, config.get('/authentication'), {
    expiresIn: '30d',
    algorithm: 'HS256'
  });
  return token;
};

module.exports.registerUser = async (inputData) => {
  const t = await sequelize.transaction();

  try {
    const existData = await this.detailUser({
      name: inputData.name,
      phone_number: inputData.phone_number
    });

    if (existData && existData.length > 0) {
      throw new ConflictError('User with that phone number already exist');
    }

    inputData.password = await bcrypt.hash(inputData.password, +SALT_ROUNDS);

    const dataUser = await User.create(inputData, { transaction: t });

    const resultUser = dataUser.get({ plain: true });
    delete resultUser.password;

    const mockSavingData = {
      balance: 0,
      earmarked_balance: 0,
      user_id: resultUser.id,
      account_number: await generateUniqueAccountNumber(),
    }

    const dataMock = await MockSavingsAccount.create(mockSavingData, { transaction: t });

    const resultMock = dataMock.get({ plain: true });

    await t.commit();
    return { resultUser, resultMock };
  } catch (error) {
    logger.error(error);
    await t.rollback();
    if (
      error instanceof ConflictError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.detailUser = async (attr) => {
  try {
    const data = await User.findAll({
      where: attr
    });

    if (!data) {
      throw new NotFoundError("Product not found");
    }

    return data;
  } catch (error) {
    logger.error(error);
    if (
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.loginUser = async (loginData) => {
  try {
    const userData = await User.findOne({
      where: {
        phone_number: loginData.phone_number
      }
    });

    if (!userData) {
      throw new NotFoundError('Wrong phone number / password');
    };

    const isMatch = await bcrypt.compare(loginData.password, userData.password);

    if (!isMatch) {
      throw new UnauthorizedError('Wrong phone number / password');
    }

    const user = userData.get({ plain: true });
    delete user.password;

    const token = await this.generateToken({
      id: user.id,
      phone_number: user.phone_number,
      name: user.name
    })

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

module.exports.userProfile = async (userData) => {
  try {
    const cacheKey = `user:${userData.phone_number}`
    const cache = await redis.get(cacheKey);
    let user = null;
    if (cache) {
      try {
        user = JSON.parse(cache);
      } catch (err) {
        logger.error(`Failed to parse cache for key ${cacheKey}`, err);
        await redis.del(cacheKey);
      }
    }

    if (!user) {
      user = await User.findOne({
        where: {
          phone_number: userData.phone_number
        }
      });

      if (!user) {
        throw new NotFoundError('User with that phone number not found');
      }

      await redis.set(cacheKey, JSON.stringify(user), 'EX', 180);
    }

    const mock = await MockSavingsAccount.findOne({
      where: {
        user_id: user.id
      }
    });

    if (!mock) {
      throw new NotFoundError('User with that phone number not found');
    }

    return { user, mock };
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