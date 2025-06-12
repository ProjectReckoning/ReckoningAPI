const { InternalServerError, ConflictError } = require("../../helpers/error");
const bcrypt = require('bcrypt');
const SALT_ROUNDS = process.env.SALT_ROUNDS;

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
    throw new InternalServerError(error.message);
  }
}