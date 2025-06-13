const wrapper = require("../../helpers/utils/wrapper");
const pocketModules = require("../../modules/pocket/pocketModules");
const logger = require("../../helpers/utils/logger");

module.exports.createPocket = async (req, res) => {
  const accountNumber = await pocketModules.generateUniqueAccountNumber();
  console.log("Generated Account Number:", accountNumber);
  const pocketData = {
    name: req.body.name,
    type: req.body.type,
    target_nominal: parseFloat(req.body.target_nominal),
    current_balance: parseFloat(req.body.target_nominal),
    deadline: req.body.deadline ? new Date(req.body.deadline) : null,
    status: req.body.status,
    owner_user_id: req.userData.id,
    icon_name: req.body.icon_name,
    color_hex: req.body.color_hex,
    account_number: accountNumber,
  };

  pocketModules
    .createPocket(pocketData)
    .then((pocket)=>{
      return pocketModules
        .addMemberToPocket({
          pocket_id: pocket.id,
          user_id: req.userData.id,
          role: "owner",
        })
        .then(() => {
          logger.info("Pocket created successfully");
          return wrapper.response(
            res,
            "success",
            wrapper.data(pocket),
            "Pocket created successfully",
            201
          );
        });
    })
    .catch((error)=> {
      logger.error("Error creating pocket", error);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(error),
        `Error creating pocket. Error: ${error.message}`,
        400
      );
    }); 
};

module.exports.getUserPocket = (req, res) => {
  pocketModules
    .getUserPockets(req.userData.id)
    .then((resp) => {
      const pocketMap = new Map();
      resp.forEach((item) => {
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
          });
        }
      });
      const result = Array.from(pocketMap.values());
      logger.info("User pockets fetched successfully");
      wrapper.response(
        res,
        "success",
        wrapper.data(result),
        "User pockets fetched successfully",
        200
      );
    })
    .catch((err) => {
      logger.error("Error fetching user pockets", err);
      wrapper.response(
        res,
        "fail",
        wrapper.error(err),
        `Error fetching user pockets. Error: ${err}`,
        400
      );
    });
};

module.exports.getPocketDetail = (req, res) => {
  const { pocketId } = req.params;
  pocketModules
    .detailPocket({ id: pocketId, owner_user_id: req.userData.id })
    .then((resp) => {
      if (resp.length === 0) {
        return wrapper.response(
          res,
          "fail",
          null,
          "Pocket not found or you do not have access to it",
          404
        );
      }
      logger.info("Pocket detail fetched successfully");
      return wrapper.response(
        res,
        "success",
        wrapper.data(resp[0]),
        "Pocket detail fetched successfully",
        200
      );
    })
    .catch((err) => {
      logger.error("Error fetching pocket detail", err);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(err),
        `Error fetching pocket detail. Error: ${err}`,
        400
      );
    });
};

module.exports.updatePocket = (req,res) => {
  const { pocketId } = req.params;
  const userId = req.userData.id;
  const updateData = req.body;

  pocketModules.updatePocket(pocketId, userId, updateData)
    .then((updatedPocket)=> {
      logger.info("Pocket updated successfully");
      return wrapper.response(res,'success',wrapper.data(updatedPocket), 'Pocket updated successfully', 200);
    })
    .catch((error)=> {
      logger.error("Error while updating pocket", error);
      return wrapper.response(res,'fail',wrapper.error(error),`Error updating pocket. Error: ${error.message} `,400);
    });
}

module.exports.deletePocket = (req,res) => {
  const { pocketId } = req.params;
  pocketModules
    .deletePocket(pocketId)
    .then(resp => {
      logger.info("Pocket deleted successfully");
      wrapper.response(res, 'success', wrapper.data(resp),'Product has been deleted', 200);
    })
    .catch(err => {
      logger.error("Error while deleting pocket", err);
      wrapper.response(res,'fail', wrapper.error(err),`Error while deleting pocket. Error: ${err}`,400)
    })
}

