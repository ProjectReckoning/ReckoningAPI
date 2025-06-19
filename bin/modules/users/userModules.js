const { InternalServerError, BadRequestError, NotFoundError } = require("../../helpers/error");
const logger = require("../../helpers/utils/logger");
const { MockSavingsAccount } = require('../../models');
const { Sequelize } = require('sequelize');

module.exports.addBalance = async (userId, balance) => {
  try {
    const [affectedRows] = await MockSavingsAccount.increment(
      { balance: balance },
      { where: { user_id: userId } }
    );

    if (affectedRows === 0) {
      throw new NotFoundError("User's mock saving account not found");
    }

    const updated = await MockSavingsAccount.findOne({
      where: {
        user_id: userId
      }
    });

    return { balance: updated.balance };
  } catch (error) {
    logger.error(error);

    if (error instanceof BadRequestError) {
      throw error;
    }

    throw new InternalServerError(error.message);
  }
};
