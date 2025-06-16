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