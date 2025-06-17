const wrapper = require("../../helpers/utils/wrapper");
const pocketModules = require("../../modules/pocket/pocketModules");
const logger = require("../../helpers/utils/logger");
const { sequelize } = require("../../models");

module.exports.getBusinessPockets = async (req, res) => {
    pocketModules
    .getUserPockets(req.userData.id)
    .then((resp) => {
      const pocketMap = new Map();

      // Filter hanya pocket bertipe 'business'
      const businessPockets = resp.filter((item) => item.type == 'business');

      businessPockets.forEach((item) => {
        if (!pocketMap.has(item.name)) {
          pocketMap.set(item.name, {
            pocket_id: item.id,
            name: item.name,
            type: item.type,
            target_nominal: item.target_nominal,
            current_balance: item.current_balance,
            deadline: item.deadline ? new Date(item.deadline) : null,
            status: item.status,
            icon_name: item.icon_name,
            color_hex: item.color_hex,
            account_number: item.account_number,
            user_role: item.pocketMembers?.[0]?.role
          });
        }
      });

      const result = Array.from(pocketMap.values());
      logger.info("Business pockets fetched successfully");

      wrapper.response(
        res,
        "success",
        wrapper.data(result),
        "Business pockets fetched successfully",
        200
      );
    })
    .catch((err) => {
      logger.error("Error fetching business pockets", err);
      wrapper.response(
        res,
        "fail",
        wrapper.error(err),
        `Error fetching business pockets. Error: ${err}`,
        400
      );
    });
}

module.exports.getAllBusinessLast5TransactionsHistory = async (req, res) => {
  const userData = req.userData;

  pocketModules
    .getLast5BusinessTransactionsForUser(userData.id)
    .then((resp) => {
      logger.info("Pocket's transaction history has been fetched");
      return wrapper.response(res, "success", wrapper.data(resp), "Pocket's transaction history has been fetched", 200);
    })
    .catch((error) => {
      logger.error("Error while fetching pocket's transaction history", error);
      return wrapper.response(res, "fail", wrapper.error(error), `Error while fetching pocket's transaction history. Error: ${error.message}`, 400);
    });
}

module.exports.getLast5BusinessPocketHistory = async (req, res) => {
  const userData = req.userData;
  const pocketId = req.params.pocketId;

  pocketModules
    .getLast5BusinessTransactionsForUser(userData.id, pocketId)
    .then((resp) => {
      logger.info("Pocket's transaction history has been fetched");
      return wrapper.response(res, "success", wrapper.data(resp), "Pocket's transaction history has been fetched", 200);
    })
    .catch((error) => {
      logger.error("Error while fetching pocket's transaction history", error);
      return wrapper.response(res, "fail", wrapper.error(error), `Error while fetching pocket's transaction history. Error: ${error.message}`, 400);
    });
}