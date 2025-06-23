const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} = require("../../helpers/error");
const { Pocket, PocketMember, User, sequelize, MockSavingsAccount } = require("../../models");
const logger = require("../../helpers/utils/logger");
const { where, Op } = require("sequelize");
const { Transaction } = require("../../models");
const { startOfMonth, endOfMonth, subDays, subMonths, subYears, startOfDay } = require("date-fns");
const config = require('../../config');
const MongoDb = require('../../config/database/mongodb/db');
const mongoDb = new MongoDb(config.get('/mongoDbUrl'));
const notificationModules = require('../users/notificationModules');
const { ObjectId } = require("mongodb");

module.exports.createPocket = async (pocketData, owner, additionalMembers) => {
  const t = await sequelize.transaction();
  try {
    let addonMessage = ''
    // Create Pocket
    const pocket = await Pocket.create(pocketData, { transaction: t });

    // Add creator as PocketMember
    await PocketMember.create({
      user_id: owner.id,
      pocket_id: pocket.id,
      role: 'owner',
      contribution_amount: 0,
      joined_at: new Date(),
      is_active: 1
    }, { transaction: t });

    await t.commit();
    addonMessage = 'Pocket creation success'

    // Notify invited friends
    if (Array.isArray(additionalMembers) && additionalMembers.length > 0) {
      mongoDb.setCollection('invitationStatus');
      try {
        for (const member of additionalMembers) {
          const inviteData = await mongoDb.insertOne({
            type: 'pocket_invite',
            inviterUserId: owner.id,
            invitedUserId: member.user_id,
            pocketId: pocket.id,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
          })

          // Send notification will be here
          const pushToken = await notificationModules.getPushToken(member.user_id);
          const notifMessage = notificationModules.setNotificationData({
            pushToken,
            title: `Invitation to pocket ${pocket.name} from ${owner.name}`,
            body: `${owner.name} has been invite you to pocket ${pocket.name}, you could accept or reject it`,
            data: {
              invite_id: inviteData.data._id,
              // Fill the rest later
            }
          })

          await notificationModules.pushNotification(notifMessage);
        }
        addonMessage = 'Pocket creation and invite friend success';
      } catch (error) {
        logger.warn('Notification or invite failed', error);
        addonMessage = 'Pocket creation success but some or all invite friend failed'
      }
    }

    return { pocket, addonMessage };
  } catch (error) {
    await t.rollback();
    logger.error(error);
    throw new InternalServerError(error.message);
  }
};

module.exports.respondInvite = async (userData, responseData) => {
  const t = await sequelize.transaction();
  try {
    mongoDb.setCollection('invitationStatus');
    const invitation = await mongoDb.findOne({
      _id: ObjectId(responseData.inviteId)
    });

    if (!invitation.data || invitation.err) {
      throw new NotFoundError('Invitation not found');
    }

    if (invitation.data.invitedUserId != userData.id) {
      throw new ConflictError('This is not an invitation for this user');
    }

    if (invitation.data.status !== 'pending') {
      throw new ConflictError('User already responded to this invitiation')
    }

    const pocketMember = await PocketMember.findOne({
      where: {
        user_id: invitation.data.invitedUserId,
        pocket_id: invitation.data.pocketId
      }
    });

    const pocket = await Pocket.findByPk(invitation.data.pocketId);

    if (pocketMember) {
      throw new ConflictError('User already in the pocket');
    }

    const result = {
      message: 'User has respond the invitation',
    }

    let role = 'viewer';
    if (pocket.type == 'business') {
      role = 'spender';
    }

    // Add user as PocketMember
    if (responseData.response === 'accepted') {
      const member = await PocketMember.create({
        user_id: invitation.data.invitedUserId,
        pocket_id: invitation.data.pocketId,
        role: role,
        contribution_amount: 0,
        joined_at: new Date(),
        is_active: 1
      }, { transaction: t });

      result.message = 'User has respond the invitation. Response: ACCEPTED';
      result.member = member;
    }

    await t.commit();

    await mongoDb.upsertOne({
      _id: ObjectId(responseData.inviteId)
    }, {
      $set: {
        status: responseData.response,
        updated_at: new Date()
      }
    })

    try {
      // Send notification will be here
      const pushToken = await notificationModules.getPushToken(invitation.data.inviterUserId);
      const notifMessage = notificationModules.setNotificationData({
        pushToken,
        title: `${userData.name} already ${responseData.response} your invitation`,
        body: ``,
        data: {
          invite_id: inviteData.data._id,
          // Fill the rest later
        }
      })

      await notificationModules.pushNotification(notifMessage);
    } catch (error) {
      logger.error('Notification failed to send');
    }

    return result;
  } catch (error) {
    logger.error(error);
    await t.rollback()
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.detailPocket = async (pocketId, userId) => {
  try {
    const isMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      }
    })

    if (!isMember) {
      throw new ForbiddenError("You do not have access to this pocket");
    }

    const data = await Pocket.findOne({
      where: { id: pocketId },
      attributes: [
        "id",
        "name",
        "type",
        "target_nominal",
        "current_balance",
        "deadline",
        "status",
        "icon_name",
        "color_hex",
        "account_number",
        "owner_user_id"
      ],
      include: [
        {
          model: PocketMember,
          as: "pocketMembers",
          where: { user_id: userId },
          attributes: ["role"],
          required: false,
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "name", "phone_number"],
        },
        {
          model: User,
          as: "members",
          attributes: ["id", "name", "phone_number"],
        },
      ],
    });

    console.log("Detail Pocket Data:", data);

    if (!data) return null;

    // Tentukan user_role: jika dia member ambil dari PocketMember, kalau bukan, cek apakah owner
    let user_role = 'viewer'; // fallback
    if (data.owner_user_id === userId) {
      user_role = 'owner';
    } else if (data.pocketMembers?.length) {
      user_role = data.pocketMembers[0].role;
    }

    const { pocketMembers, ...pocketDetails } = data.get({ plain: true });

    const result = {
      ...pocketDetails,
      user_role,
    };

    return result;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

module.exports.getUserPockets = async (userId) => {
  try {
    const data = await Pocket.findAll({
      include: [
        {
          model: PocketMember,
          as: "pocketMembers",
          where: { user_id: userId },
          attributes: ["role"],
        },
      ],
    });

    if (!data || data.length === 0) {
      throw new NotFoundError("No pockets found for this user");
    }

    return data;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

module.exports.generateUniqueAccountNumber = async () => {
  const randomDigits = () => Math.floor(100000000 + Math.random() * 900000000);
  let accountNumber;
  let isUnique = false;

  while (!isUnique) {
    accountNumber = randomDigits();
    accountNumber = accountNumber.toString();
    const existingPocket = await Pocket.findOne({
      where: { account_number: accountNumber },
    });

    const existingMock = await MockSavingsAccount.findOne({
      where: { account_number: accountNumber },
    });

    if (!existingPocket && !existingMock) {
      isUnique = true;
    }
  }

  return accountNumber;
};

module.exports.addMemberToPocket = async ({
  pocket_id,
  user_id,
  role = "member",
  contribution_amount = 0,
}) => {
  try {
    const member = await PocketMember.create({
      pocket_id,
      user_id,
      role,
      contribution_amount,
      joined_at: new Date(),
      is_active: true,
    });
    return member;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

module.exports.updatePocket = async (pocketId, userId, updateData) => {
  try {
    const pocket = await Pocket.findOne({
      where: { id: pocketId, owner_user_id: userId },
    });

    const member = await PocketMember.findOne({
      where: { pocket_id: pocketId, user_id: userId }
    })

    if (!pocket && !member) {
      throw new Error("Pocket not found or you don't have access");
    }

    // Jika dia bukan owner atau admin, tidak boleh update
    if (member && member.role !== "owner" && member.role !== "admin") {
      throw new ForbiddenError("You do not have permission to update this pocket");
    }

    await pocket.update(updateData);

    return pocket;
  } catch (error) {
    throw error;
  }
};

module.exports.deletePocket = async (userId, pocketId) => {
  try {
    const pocket = await Pocket.findByPk(pocketId);
    if (!pocket) {
      throw new NotFoundError("Pocket not found");
    }

    // Cek apakah userId adalah owner dari pocket ini
    if (pocket.owner_user_id !== userId) {
      throw new ForbiddenError("You do not have permission to delete this pocket");
    }

    // Cek apakah ada anggota yang masih terdaftar di pocket ini
    const members = await PocketMember.findAll({
      where: { pocket_id: pocketId },
    });

    if (members.length > 1) {
      throw new BadRequestError(
        "Cannot delete pocket with existing members. Please remove all members first."
      );
    }

    await pocket.destroy();

    return { message: "Pocket deleted successfully" };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.bulkAddMembersToPocket = async (userData, pocketId, memberDataArray) => {
  try {
    const userIds = memberDataArray.map((m) => m.user_id);

    // Check if pocket exist
    const pocket = await Pocket.findByPk(pocketId)

    if (!pocket) {
      throw new NotFoundError('Pocket not found');
    }

    // Cek siapa yang sudah jadi member di pocket ini
    const existingMembers = await PocketMember.findAll({
      where: {
        pocket_id: pocketId,
        user_id: { [Op.in]: userIds },
      },
    });

    const existingUserIds = existingMembers.map((m) => m.user_id);

    // Filter hanya yang belum ada
    const newMembers = memberDataArray.filter(
      (m) => !existingUserIds.includes(m.user_id)
    );

    if (newMembers.length === 0) {
      throw new ConflictError("All users are already members of this pocket");
    }

    mongoDb.setCollection('invitationStatus');
    try {
      await Promise.all(newMembers.map(async (member) => {
        const inviteData = await mongoDb.insertOne({
          type: 'pocket_invite',
          inviterUserId: userData.id,
          invitedUserId: member.user_id,
          pocketId: member.pocket_id,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        })

        // Send notification will be here
        const pushToken = await notificationModules.getPushToken(member.user_id);
        const notifMessage = notificationModules.setNotificationData({
          pushToken,
          title: `Invitation to pocket ${pocket.name} from ${userData.name}`,
          body: `${userData.name} has been invite you to pocket ${pocket.name}, you could accept or reject it`,
          data: {
            invite_id: inviteData.data._id,
            // Fill the rest later
          }
        })

        await notificationModules.pushNotification(notifMessage);
      }))
    } catch (error) {
      addonMessage = 'Pocket creation success but some or all invite friend failed'
    }

    return {
      members: newMembers,
      skipped: existingMembers,
    };
  } catch (error) {
    logger.error(error);
    if (
      error instanceof ConflictError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.validateNoSelfAsMember = (membersFromRequest, userId) => {
  const isIncluded = membersFromRequest.some(
    (member) => member.user_id === userId
  );
  if (isIncluded) {
    throw new BadRequestError(
      "Authenticated user cannot be included as a member"
    );
    // throw new ConflictError("Authenticated user cannot be included as a member");
  }
};

module.exports.getMembersOfPocket = async (pocketId, userId) => {
  try {
    // Cek apakah userId merupakan anggota dari pocket
    const isMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
    });

    if (!isMember) {
      throw new ForbiddenError("You do not have access to this pocket");
    }

    // Ambil semua member dari pocket
    const members = await PocketMember.findAll({
      where: { pocket_id: pocketId },
      include: [
        {
          model: User,
          as: "members",
          attributes: ["id", "name", "phone_number"],
        },
      ],
    });

    if (!members || members.length === 0) {
      throw new NotFoundError("No members found for this pocket");
    }

    return members;
  } catch (error) {
    logger.error(error);
    throw new InternalServerError(error.message);
  }
};

module.exports.deletePocketMember = async (pocketId, userId, memberList) => {
  try {
    // Cek apakah userId merupakan anggota dari pocket
    const isMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
    });

    if (
      !isMember ||
      (isMember?.role !== "owner" && isMember?.role !== "admin")
    ) {
      throw new ForbiddenError("You do not have access to this pocket");
    }

    // Hapus anggota yang ada di memberList
    const deletedMembers = await PocketMember.destroy({
      where: {
        pocket_id: pocketId,
        user_id: memberList,
      },
    });
    if (deletedMembers === 0) {
      throw new NotFoundError("No members found to delete");
    }
    return {
      message: "Members deleted successfully",
      count: deletedMembers,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};


module.exports.leavePocket = async (pocketId, userId) => {
  try {
    // Check if the user is a member of the pocket
    const isMember = await PocketMember.findAll({
      where: {
        pocket_id: pocketId
      },
    });

    const member = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
    })

    if (member.role === "owner") {
      throw new BadRequestError("Can't Leave before all members are removed");
    }

  } catch (error) {
    logger.error(error);
    throw new InternalServerError(error.message);
  }
}

module.exports.updateRolePocketMember = async (
  pocketId,
  userId,
  memberId,
  newRole
) => {
  try {
    // Siapa yang melakukan perubahan?
    const requestingMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
    });

    if (!requestingMember) {
      throw new ForbiddenError("You are not a member of this pocket");
    }

    const isRequesterOwner = requestingMember.role === "owner";
    const isRequesterAdmin = requestingMember.role === "admin";

    if (!isRequesterOwner && !isRequesterAdmin) {
      throw new ForbiddenError("You do not have permission to update roles");
    }

    // Target member yang role-nya akan diubah
    const targetMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: memberId,
      },
    });

    if (!targetMember) {
      throw new NotFoundError("Target member not found in this pocket");
    }

    if (targetMember.role === "owner") {
      throw new BadRequestError("You cannot change the role of the owner");
    }

    // Admin tidak boleh mengubah admin lain atau sesama admin
    if (isRequesterAdmin && targetMember.role !== "member") {
      throw new ForbiddenError("Admin can only change role of regular members");
    }

    // owner hanya ada 1 di dalam 1 pocket dan sudah pasti ada owner nya
    if (newRole == "owner") {
      throw new BadRequestError(
        "Invalid role specified. Owner role cannot be assigned through this endpoint."
      );
    }

    // Owner bisa mengubah admin maupun member
    targetMember.role = newRole;
    console.log("Target Member:", targetMember);
    await targetMember.save();

    return {
      message: "Member role updated successfully",
      updatedMember: {
        user_id: targetMember.user_id,
        new_role: targetMember.role,
      },
    };
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof NotFoundError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }

    throw new InternalServerError(error.message);
  }
};

module.exports.changeOwnerPocket = async (pocketId, userId, newOwnerId) => {
  try {
    const requestingMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
    });
    if (!requestingMember || requestingMember.role !== "owner") {
      throw new ForbiddenError(
        "You do not have permission to change the owner"
      );
    }
    const newOwnerMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: newOwnerId,
      },
    });
    if (!newOwnerMember) {
      throw new NotFoundError("New owner is not a member of this pocket");
    }
    if (newOwnerMember.role === "owner") {
      throw new BadRequestError(
        "This user is already the owner of this pocket"
      );
    }
    // Ubah role dari newOwnerMember menjadi owner
    requestingMember.role = "admin"; // Ubah role dari requestingMember menjadi admin
    newOwnerMember.role = "owner";
    await requestingMember.save();
    await newOwnerMember.save();
  } catch (error) {
    if (
      error instanceof ForbiddenError ||
      error instanceof NotFoundError ||
      error instanceof BadRequestError
    ) {
      throw error;
    }

    throw new InternalServerError(error.message);
  }
}

module.exports.getPocketHistory = async (pocketId, month) => {
  try {
    const startDate = startOfMonth(new Date(month));
    const endDate = endOfMonth(new Date(month));

    const history = await Transaction.findAll({
      where: {
        pocket_id: pocketId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["createdAt", "DESC"]],
    });

    const groupedHistory = {};

    const incomingTypes = ["Contribution", "AutoTopUp", "AutoRecurring"];
    // const outgoingTypes = ["Withdrawal", "Payment"]; // not used actually

    history.forEach((tx) => {
      const dateKey = tx.createdAt.toISOString().split("T")[0];

      const isIncoming = incomingTypes.includes(tx.type);
      const transactionType = isIncoming ? 1 : 0;

      const mappedTx = {
        id: tx.id,
        type: tx.type,
        transaction_type: transactionType,
        amount: tx.amount,
        description: tx.description,
        is_business_expense: tx.is_business_expense,
      };

      if (!groupedHistory[dateKey]) {
        groupedHistory[dateKey] = [];
      }
      groupedHistory[dateKey].push(mappedTx);
    });

    const result = Object.keys(groupedHistory)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        transactions: groupedHistory[date],
      }));

    return result;
  } catch (error) {
    logger.error(error.message);
    throw new InternalServerError(error.message);
  }
};

module.exports.getLast5BusinessTransactionsForUser = async (userId, pocketId = null) => {
  try {
    const incomingTypes = ["Contribution", "AutoTopUp", "AutoRecurring"];

    // 1. Find business pockets the user is a member of (optionally filter by pocketId)
    const pocketWhere = { type: 'business' };
    if (pocketId) {
      pocketWhere.id = pocketId;
    }

    const businessPockets = await Pocket.findAll({
      where: pocketWhere,
      include: [{
        model: PocketMember,
        as: 'pocketMembers',
        where: { user_id: userId },
        attributes: [],
        required: true
      }],
      attributes: ['id']
    });

    const businessPocketIds = businessPockets.map(p => p.id);

    if (businessPocketIds.length === 0) return [];

    const transactions = await Transaction.findAll({
      where: {
        pocket_id: { [Op.in]: businessPocketIds }
      },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const result = transactions.map(tx => ({
      type: tx.type,
      description: tx.description,
      amount: tx.amount,
      transaction_type: incomingTypes.includes(tx.type) ? 1 : 0
    }));

    return result;
  } catch (error) {
    logger.error(error.message);
    throw new InternalServerError(error.message);
  }
}

module.exports.getBusinessPocketTransactionHistory = async (userId, { pocketId = null, duration = '30d' } = {}) => {
  try {
    const incomeTypes = ["Contribution", "AutoTopUp", "AutoRecurring", "Income", "Topup"];

    const pocketWhere = { type: 'business' };
    if (pocketId) {
      pocketWhere.id = pocketId;
    }

    const businessPockets = await Pocket.findAll({
      where: pocketWhere,
      include: [{
        model: PocketMember,
        as: 'pocketMembers',
        where: { user_id: userId },
        attributes: [],
        required: true
      }],
      attributes: ['id']
    });

    const businessPocketIds = businessPockets.map(p => p.id);
    if (businessPocketIds.length === 0) return [];

    let fromDate = new Date();
    switch (duration) {
      case '3m':
        fromDate = subMonths(fromDate, 3);
        break;
      case '6m':
        fromDate = subMonths(fromDate, 6);
        break;
      case '1y':
        fromDate = subYears(fromDate, 1);
        break;
      case '30d':
      default:
        fromDate = subDays(fromDate, 30);
        break;
    }
    fromDate = startOfDay(fromDate);

    const transactions = await Transaction.findAll({
      where: {
        pocket_id: { [Op.in]: businessPocketIds },
        createdAt: { [Op.gte]: fromDate }
      },
      include: [{
        model: User,
        as: 'initiator',
        attributes: ['name']
      }],
      order: [['createdAt', 'DESC']]
    });

    return transactions.map(tx => ({
      createdAt: tx.createdAt,
      initiator_user: tx.initiator ? tx.initiator.name : null,
      type: tx.type,
      amount: tx.amount,
      purpose: tx.purpose,
      transaction_type: incomeTypes.includes(tx.type) ? 1 : 0
    }));
  } catch (error) {
    logger.error(error.message);
    throw new InternalServerError(error.message);
  }
}
