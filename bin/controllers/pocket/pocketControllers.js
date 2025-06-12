const wrapper = require("../../helpers/utils/wrapper");
const pocketModules = require("../../modules/pocket/pocketModules");
const logger = require("../../helpers/utils/logger");

module.exports.createPocket = (req, res) => {
  const pocketData = {
    name: req.body.name,
    type: req.body.type,
    target_nominal: parseFloat(req.body.target_nominal),
    current_balance: parseFloat(req.body.current_balance),
    deadline: req.body.deadline ? new Date(req.body.deadline) : null,
    status: req.body.status,
    owner_user_id: req.user.id,
    icon_name: req.body.icon_name,
    color_hex: req.body.color_hex,
    account_number: req.body.account_number,
  };

  pocketModules
    .createPocket(pocketData)
    .then((resp) => {
      logger.info("Pocket created successfully");
      return wrapper.response(
        res,
        "success",
        wrapper.data(resp),
        "Pocket created successfully",
        201
      );
    })
    .catch((err) => {
      logger.error("Error creating pocket", err);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(err),
        `Error creating pocket. Error: ${err}`,
        400
      );
    });
};
