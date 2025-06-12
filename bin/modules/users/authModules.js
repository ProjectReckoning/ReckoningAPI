const { logger } = require("sequelize/lib/utils/logger");
const { InternalServerError, ConflictError, NotFoundError, UnauthorizedError } = require("../../helpers/error");
const bcrypt = require('bcrypt');
const config = require('../../config');
const SALT_ROUNDS = process.env.SALT_ROUNDS;

const generateToken = async (data) => {
  const token = jwt.sign(data, config.get('/authentication'), {
    expiresIn: '7d',
    algorithm: 'HS256'
  });
  return token;
};

module.exports.registerUser = async (inputData) => {
  try {
    const existData = await this.detailUser({
      name: inputData.name,
      phone_number: inputData.phone_number
    });

    if (existData && existData.length > 0) {
      throw new ConflictError('User with that phone number already exist');
    }

    inputData.password = await bcrypt.hash(inputData.password, SALT_ROUNDS);

    const result = await User.create(inputData);
    return result;
  } catch (error) {
    logger.error(error);
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
      throw new NotFoundError('User not found');
    };

    const isMatch = await bcrypt.compare(loginData.password, userData.password);

    if (!isMatch) {
      throw new UnauthorizedError('Wrong phone number / password');
    }

    const user = userData.get({ plain: true });
    delete user.password;

    const token = await generateToken({
      id: user.id,
      phone_number: user.phone_number,
      role: user.role,
    })

    return token;

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