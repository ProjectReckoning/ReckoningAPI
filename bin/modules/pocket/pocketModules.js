const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require("../helpers/errors");
const { Pocket } = require("../../models");
const logger = require("../../helpers/utils/logger");

module.exports.createPocket = async (pocketData) => {
  try {
    const existData = await this.detailPocket({
      name: pocketData.name,
      owner_user_id: pocketData.owner_user_id,
    });

    logger.info("Checking if data exist");
    if (existData) {
      throw new BadRequestError("Pocket already exists");
    }

    const result = await Pocket.create(pocketData);
    return result;
  } catch (error) {
    console.log(error);
    throw new InternalServerError(error.message);
  }
};
