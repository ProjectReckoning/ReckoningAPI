const wrapper = require("../../helpers/utils/wrapper");
const pocketModules = require("../../modules/pocket/pocketModules");
const logger = require("../../helpers/utils/logger");
const { sequelize } = require("../../models");
const { getCurrentMonth } = require("../../helpers/utils/dateFormatter");
const pocket = require("../../models/pocket");

module.exports.createPocket = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const accountNumber = await pocketModules.generateUniqueAccountNumber();

    const membersFromRequest = req.body.members || [];

    pocketModules.validateNoSelfAsMember(membersFromRequest, req.userData.id);

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

    const pocket = await pocketModules.createPocket(pocketData, t);

    // Owner sebagai member utama
    const ownerMember = {
      pocket_id: pocket.id,
      user_id: req.userData.id,
      role: "owner",
    };

    const additionalMembers = membersFromRequest.map((member) => ({
      pocket_id: pocket.id,
      user_id: member.user_id,
      role: member.role || "viewer",
    }));

    const allMembers = [ownerMember, ...additionalMembers];

    const addedMembers = await pocketModules.bulkAddMembersToPocket(
      allMembers,
      t
    );

    await t.commit();

    logger.info("Pocket created and members added successfully");
    return wrapper.response(
      res,
      "success",
      wrapper.data({
        pocket,
        members: addedMembers,
      }),
      "Pocket and members created successfully",
      201
    );
  } catch (error) {
    await t.rollback();
    logger.error("Error creating pocket and members", error);
    return wrapper.response(
      res,
      "fail",
      wrapper.error(error),
      `Error creating pocket. ${error.message}`,
      400
    );
  }
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
            user_role: item.pocketMembers?.[0]?.role,
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
  const pocketId = req.params.pocketId;
  const userId = req.userData.id;
  pocketModules
    .detailPocket(pocketId, userId)
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
        wrapper.data(resp),
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

module.exports.updatePocket = (req, res) => {
  const { pocketId } = req.params;
  const userId = req.userData.id;
  const updateData = req.body;

  pocketModules
    .updatePocket(pocketId, userId, updateData)
    .then((updatedPocket) => {
      logger.info("Pocket updated successfully");
      return wrapper.response(
        res,
        "success",
        wrapper.data(updatedPocket),
        "Pocket updated successfully",
        200
      );
    })
    .catch((error) => {
      logger.error("Error while updating pocket", error);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(error),
        `Error updating pocket. Error: ${error.message} `,
        400
      );
    });
};

module.exports.deletePocket = (req, res) => {
  const { pocketId } = req.params;
  pocketModules
    .deletePocket(pocketId)
    .then((resp) => {
      logger.info("Pocket deleted successfully");
      wrapper.response(
        res,
        "success",
        wrapper.data(resp),
        "Pocket has been deleted",
        200
      );
    })
    .catch((err) => {
      logger.error("Error while deleting pocket", err);
      wrapper.response(
        res,
        "fail",
        wrapper.error(err),
        `Error while deleting pocket. Error: ${err}`,
        400
      );
    });
};

// All about the members of the pocket
module.exports.addMembersToPocket = (req, res) => {
  const { pocketId } = req.params;
  const userId = req.userData.id;
  const memberData = req.body.members;

  if (!Array.isArray(memberData)) {
    return wrapper.response(
      res,
      "fail",
      null,
      "Members data must be an array",
      400
    );
  }

  const memberDataArray = memberData.map((member) => ({
    pocket_id: pocketId,
    user_id: member.user_id,
    role: member.role || "viewer",
  }));

  pocketModules
    .bulkAddMembersToPocket(memberDataArray)
    .then((addedMembers) => {
      logger.info("Members added to pocket successfully");
      return wrapper.response(
        res,
        "success",
        wrapper.data(addedMembers),
        "Members added to pocket successfully",
        201
      );
    })
    .catch((error) => {
      logger.error("Error adding members to pocket", error);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(error),
        `Error adding members to pocket. Error: ${error.message}`,
        400
      );
    });
};

// Get members of a specific pocket
module.exports.getMembersOfPocket = (req, res) => {
  const { pocketId } = req.params;
  const userId = req.userData.id;

  pocketModules
    .getMembersOfPocket(pocketId, userId)
    .then((members) => {
      logger.info("Members of pocket fetched successfully");
      return wrapper.response(
        res,
        "success",
        wrapper.data(members),
        "Members of pocket fetched successfully",
        200
      );
    })
    .catch((error) => {
      logger.error("Error fetching members of pocket", error);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(error),
        `Error fetching members of pocket. Error: ${error.message}`,
        400
      );
    });
};

module.exports.deletePocketMember = (req, res) => {
  const { pocketId, memberId } = req.params;
  const userId = req.userData.id;

  pocketModules
    .deletePocketMember(pocketId, memberId, userId)
    .then(() => {
      logger.info("Pocket member deleted successfully");
      return wrapper.response(
        res,
        "success",
        null,
        "Pocket member deleted successfully",
        200
      );
    })
    .catch((error) => {
      logger.error("Error deleting pocket member", error);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(error),
        `Error deleting pocket member. Error: ${error.message}`,
        400
      );
    });
};

module.exports.updateRolePocketMember = async (req, res) => {
  try {
    const pocketId = parseInt(req.params.pocketId);
    const memberId = parseInt(req.params.memberId);
    const userId = req.userData.id;
    const newRole = req.body.role;

    const result = await pocketModules.updateRolePocketMember(
      pocketId,
      userId,
      memberId,
      newRole
    );

    logger.info(
      `User ${userId} updated role of member ${memberId} to ${newRole}`
    );
    return wrapper.response(
      res,
      "success",
      wrapper.data(result),
      "Member role updated successfully",
      200
    );
  } catch (error) {
    logger.error("Failed to update member role", error);
    return wrapper.response(
      res,
      "fail",
      wrapper.error(error),
      error.message || "Internal server error",
      error.code || 500
    );
  }
};

module.exports.changeOwnerPocket = async (req, res) => {
  try {
    const pocketId = parseInt(req.params.pocketId);
    const newOwnerId = parseInt(req.body.new_owner_id);
    const userId = req.userData.id;

    const result = await pocketModules.changeOwnerPocket(
      pocketId,
      userId,
      newOwnerId
    );

    logger.info(
      `User ${userId} changed owner of pocket ${pocketId} to ${newOwnerId}`
    );
    return wrapper.response(
      res,
      "success",
      wrapper.data(result),
      "Pocket owner changed successfully",
      200
    );
  } catch (error) {
    logger.error("Failed to change pocket owner", error);
    return wrapper.response(
      res,
      "fail",
      wrapper.error(error),
      error.message || "Internal server error",
      error.code || 500
    );
  }
};

module.exports.getPocketHistory = async (req, res) => {
  const { pocketId } = req.params;
  let month = req.query.month;

  if (!month) {
    month = getCurrentMonth();
  }

  pocketModules
    .getPocketHistory(pocketId, month)
    .then((resp) => {
      logger.info("Pocket's transaction history has been fetched");
      return wrapper.response(
        res,
        "success",
        wrapper.data(resp),
        "Pocket's transaction history has been fetched",
        200
      );
    })
    .catch((error) => {
      logger.error("Error while fetching pocket's transaction history", error);
      return wrapper.response(
        res,
        "fail",
        wrapper.error(error),
        `Error while fetching pocket's transaction history. Error: ${error.message}`,
        400
      );
    });
};
