const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
} = require("../../helpers/error");
const { Pocket } = require("../../models");
const logger = require("../../helpers/utils/logger");
const { where } = require("sequelize");

module.exports.createPocket = async (pocketData) => {
  try {
    const existData = await this.detailPocket({
      name: pocketData.name,
      owner_user_id: pocketData.owner_user_id,
    });

    logger.info("Checking if data exist");
    console.log("Exist Data:", existData);
    if (existData.length > 0) {
      throw new BadRequestError("Pocket already exists");
    }

    const result = await Pocket.create(pocketData);
    return result;
  } catch (error) {
    console.log(error);
    throw new InternalServerError(error.message);
  }
};

module.exports.detailPocket = async (attr) => {
  try {
    const data = await Pocket.findAll({
      where: attr,
      attributes: [
        "name",
        "type",
        "target_nominal",
        "current_balance",
        "deadline",
        "status",
        "icon_name",
        "color_hex",
        "account_number",
      ],
    });

    return data;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
}

module.exports.getUserPockets =  async (userId) => {
  try{
    const data = await Pocket.findAll({
      where: {
        owner_user_id: userId
      }
    });

    if (!data || data.length === 0) {
      throw new NotFoundError("No pockets found for this user");
    }

    return data;
  }catch (error) {
    throw new InternalServerError(error.message);
  }
}

module.exports.generateUniqueAccountNumber = async () =>{
  const randomDigits = () => Math.floor(100000000 + Math.random()* 900000000);
  let accountNumber;
  let isUnique = false;

  while(!isUnique){
    accountNumber = randomDigits();
    accountNumber = accountNumber.toString();
    const existingPocket = await Pocket.findOne({ where: {account_number: accountNumber}});
    if(!existingPocket){
      isUnique = true;
    }
  }

  return accountNumber;
}