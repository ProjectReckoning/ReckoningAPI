const {
  InternalServerError,
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
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
      try {
        const { addonMessage: inviteMsg } = await this.inviteMember(owner, additionalMembers, pocket.id);
        addonMessage = `Pocket creation and ${inviteMsg.toLowerCase()}`;
      } catch (err) {
        logger.warn('Invitation failed after pocket creation', err);
        addonMessage = 'Pocket creation success but some or all invite friend failed';
      }
    }

    return { pocket, addonMessage };
  } catch (error) {
    await t.rollback();
    logger.error(error);
    throw new InternalServerError(error.message);
  }
};

module.exports.inviteMember = async (userData, additionalMembers, pocketId) => {
  try {
    const pocket = await Pocket.findByPk(pocketId);
    if (!pocket) throw new NotFoundError('Pocket not found');

    const results = [];
    const inviteDataList = [];

    if (Array.isArray(additionalMembers) && additionalMembers.length > 0) {

      for (const member of additionalMembers) {
        try {
          const userMember = await User.findOne({ where: { id: member.user_id } });
          if (!userMember) throw new NotFoundError(`User ${member.user_id} not found`);

          mongoDb.setCollection('invitationStatus');
          const inviteData = await mongoDb.insertOne({
            type: 'pocket_invite',
            inviterUserId: userData.id,
            invitedUserId: member.user_id,
            pocketId: pocket.id,
            status: 'pending',
            created_at: new Date(),
            updated_at: new Date()
          });
          inviteDataList.push(inviteData);

          const notifData = {
            date: new Date(),
            type: 'member_approval_needed',
            message: `${userData.name} has invited you to pocket ${pocket.name}, you could accept or reject it`,
            requestedBy: {
              id: userData.id,
              name: userData.name
            },
            pocket: pocket.get({ plain: true }),
            inviteData: inviteData.data,
            user_id: member.user_id
          };

          const pushToken = await notificationModules.getPushToken(member.user_id);
          const notifMessage = notificationModules.setNotificationData({
            pushToken,
            title: `Invitation to pocket ${pocket.name} from ${userData.name}`,
            body: notifData.message,
            data: notifData
          });

          await notificationModules.pushNotification(notifMessage);
          mongoDb.setCollection('notifications');
          await mongoDb.insertOne(notifMessage[0]);

          results.push({ user_id: member.user_id, status: 'success' });
        } catch (err) {
          logger.warn(`Invitation failed for user ${member.user_id}`, err);
          results.push({ user_id: member.user_id, status: 'failed', error: err.message });
        }
      }
    }

    const anyFailed = results.some(r => r.status === 'failed');
    const addonMessage = anyFailed ? 'Some or all invite friend failed' : 'Invite friend success';

    return { inviteData: inviteDataList, results, addonMessage };
  } catch (error) {
    logger.error(error);
    throw new InternalServerError(error.message);
  }
};

module.exports.respondInvite = async (userData, responseData) => {
  const t = await sequelize.transaction();
  try {
    mongoDb.setCollection('invitationStatus');
    const invitation = await mongoDb.findOne({
      _id: new ObjectId(responseData.inviteId)
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
      },
      transaction: t
    });

    const pocket = await Pocket.findByPk(invitation.data.pocketId, { transaction: t });

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
    let member;
    if (responseData.response === 'accepted') {
      member = await PocketMember.create({
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

    const new_updated_at = new Date();
    await mongoDb.upsertOne({
      _id: new ObjectId(responseData.inviteId)
    }, {
      $set: {
        status: responseData.response,
        updated_at: new_updated_at
      }
    })

    mongoDb.setCollection('notifications');
    await mongoDb.upsertOne({
      'data.user_id': userData.id,
      'data.inviteData._id': new ObjectId(responseData.inviteId),
    }, {
      $set: {
        'data.inviteData.status': responseData.response,
        'data.inviteData.updated_at': new_updated_at
      }
    })

    try {
      // Send notification will be here
      const notifData = {
        date: new Date(),
        type: 'information',
        message: `${userData.name} already ${responseData.response} your invitation to pocket ${pocket.name}`,
        user_id: invitation.data.inviterUserId
      }
      const pushToken = await notificationModules.getPushToken(invitation.data.inviterUserId);
      const notifMessage = notificationModules.setNotificationData({
        pushToken,
        title: `${pocket.name}`,
        body: `${userData.name} already ${responseData.response} your invitation`,
        data: notifData
      })

      await notificationModules.pushNotification(notifMessage);

      mongoDb.setCollection('notifications');
      await mongoDb.insertOne(notifMessage[0]);
    } catch (error) {
      logger.error('Notification failed to send', error);
    }

    await t.commit();

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
    });

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
          required: false,
          include: [
            {
              model: User,
              as: "members",
              attributes: ["id", "name", "phone_number"],
              required: false
            }
          ]
        },
      ]
    });

    const last_topup = await Transaction.findOne({
      where: {
        pocket_id: data.id,
        initiator_user_id: userId,
        type: 'Income',
        [Op.or]: [
          { category: 'topup' },
          { category: 'autobudget' }
        ]
      },
      order: [
        ['updatedAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      attributes: ['updatedAt'],
      raw: true
    })

    if (!data) return null;

    const history = await Transaction.findAll({
      where: { pocket_id: pocketId },
      order: [["createdAt", "DESC"]],
    });

    // Check income and outcome
    let pemasukan = 0;
    let pengeluaran = 0;

    history.forEach((tx) => {
      tx.amount = parseFloat(tx.amount) || 0;
      if (tx.type === 'Income') {
        pemasukan += tx.amount;
      } else if (tx.type === 'Expense') {
        pengeluaran += tx.amount;
      }
    });

    pemasukan = pemasukan.toString();
    pengeluaran = pengeluaran.toString();

    const plainData = data.get({ plain: true });

    // Determine user_role
    let user_role = 'viewer';
    const selfMember = plainData.pocketMembers.find(m => m.user_id === userId);
    if (plainData.owner_user_id === userId) {
      user_role = 'owner';
    } else if (selfMember) {
      user_role = selfMember.role;
    }

    // How many members
    const memberCount = plainData.pocketMembers.length;
    let targetNominalMember = Math.floor(plainData.target_nominal / memberCount / 1000) * 1000;
    targetNominalMember = targetNominalMember.toString();

    // Extract owner and other members
    const ownerMember = plainData.pocketMembers.find(m => m.user_id === plainData.owner_user_id);
    const otherMembers = plainData.pocketMembers
      .filter(m => m.user_id !== plainData.owner_user_id)
      .map(m => ({
        id: m.members?.id ?? null,
        name: m.members?.name ?? null,
        phone_number: m.members?.phone_number ?? null,
        PocketMember: {
          id: m.id,
          user_id: m.user_id,
          pocket_id: m.pocket_id,
          role: m.role,
          contribution_amount: m.contribution_amount,
          target_amount: targetNominalMember,
          joined_at: m.joined_at,
          is_active: m.is_active,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        }
      }));

    const owner = ownerMember ? {
      id: ownerMember.members?.id ?? null,
      name: ownerMember.members?.name ?? null,
      phone_number: ownerMember.members?.phone_number ?? null,
      PocketMember: {
        id: ownerMember.id,
        user_id: ownerMember.user_id,
        pocket_id: ownerMember.pocket_id,
        role: ownerMember.role,
        contribution_amount: ownerMember.contribution_amount,
        target_amount: targetNominalMember,
        joined_at: ownerMember.joined_at,
        is_active: ownerMember.is_active,
        createdAt: ownerMember.createdAt,
        updatedAt: ownerMember.updatedAt
      }
    } : null;

    const result = {
      id: plainData.id,
      name: plainData.name,
      type: plainData.type,
      target_nominal: plainData.target_nominal,
      current_balance: plainData.current_balance,
      deadline: plainData.deadline,
      status: plainData.status,
      icon_name: plainData.icon_name,
      color_hex: plainData.color_hex,
      account_number: plainData.account_number,
      owner_user_id: plainData.owner_user_id,
      last_topup,

      // Final result
      owner,
      members: otherMembers,
      user_role,
      income: pemasukan,
      outcome: pengeluaran,
    };

    return result;
  } catch (error) {
    throw new InternalServerError(error.message);
  }
};

module.exports.getUserPockets = async (userId) => {
  try {
    const pockets = await Pocket.findAll({
      include: [
        {
          model: PocketMember,
          as: "pocketMembers",
          where: { user_id: userId },
          attributes: ["role"],
        },
      ],
    });

    const enrichedPockets = await Promise.all(pockets.map(async (pocket) => {
      const history = await Transaction.findAll({
        where: { pocket_id: pocket.id },
        order: [["createdAt", "DESC"]],
      });

      let pemasukan = 0;
      let pengeluaran = 0;

      history.forEach((tx) => {
        const amount = parseFloat(tx.amount) || 0;
        if (tx.type === 'Income') {
          pemasukan += amount;
        } else if (tx.type === 'Expense') {
          pengeluaran += amount;
        }
      });

      return {
        ...pocket.get({ plain: true }),
        pemasukan: pemasukan.toString(),
        pengeluaran: pengeluaran.toString(),
      };
    }));

    return enrichedPockets;
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

    if (updateData.type) {
      let target, deadline;
      if (updateData.type === "saving") {
        target = updateData.target_nominal ? parseFloat(updateData.target_nominal) : 10000;
        if (updateData.deadline) {
          deadline = new Date(updateData.deadline);
        } else {
          const now = new Date();
          deadline = new Date(now.setMonth(now.getMonth() + 6));
        }
      } else if (updateData.type === "spending") {
        target = 0;
        deadline = null;
      } else {
        target = updateData.target_nominal ? parseFloat(updateData.target_nominal) : 0;
        deadline = updateData.deadline ? new Date(updateData.deadline) : null;
      }
      updateData.target_nominal = target;
      updateData.deadline = deadline;
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
        const userMember = await User.findOne({
          where: {
            id: member.user_id
          }
        });

        if (!userMember) {
          throw new NotFoundError('User to invite not found');
        }

        const inviteData = await mongoDb.insertOne({
          type: 'pocket_invite',
          inviterUserId: userData.id,
          invitedUserId: member.user_id,
          pocketId: member.pocket_id,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date()
        })

        const notifData = {
          date: new Date(),
          type: 'member_approval_needed',
          message: `${userData.name} has been invite you to pocket ${pocket.name}, you could accept or reject it`,
          requestedBy: {
            id: userData.id,
            name: userData.name
          },
          pocket: pocket.get({ plain: true }),
          inviteData: inviteData.data,
          user_id: member.user_id
        }
        const pushToken = await notificationModules.getPushToken(member.user_id);
        const notifMessage = notificationModules.setNotificationData({
          pushToken,
          title: `Invitation to pocket ${pocket.name} from ${userData.name}`,
          body: `${userData.name} has been invite you to pocket ${pocket.name}, you could accept or reject it`,
          data: notifData
        })

        await notificationModules.pushNotification(notifMessage);

        mongoDb.setCollection('notifications');
        await mongoDb.insertOne(notifMessage[0]);
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
  const t = await sequelize.transaction();
  try {
    // Validate permission of current user
    const isMember = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
      transaction: t 
    });

    if (!isMember || (isMember.role !== "owner" && isMember.role !== "admin")) {
      throw new ForbiddenError("You do not have access to this pocket");
    }

    const pocket = await Pocket.findByPk(pocketId, { transaction: t  });
    if (!pocket) {
      throw new NotFoundError("Pocket not found");
    }

    let totalDeleted = 0;

    for (const memberId of memberList) {
      const [member, mock] = await Promise.all([
        PocketMember.findOne({
          where: {
            user_id: memberId,
            pocket_id: pocketId,
          },
          transaction: t 
        }),
        MockSavingsAccount.findOne({
          where: { user_id: memberId },
          transaction: t 
        }),
      ]);

      if (!member) {
        continue; // Skip if member is not found in this pocket
      }

      // Reduce balances
      if (mock) {
        mock.earmarked_balance -= member.contribution_amount;
        if (mock.earmarked_balance < 0) mock.earmarked_balance = 0;
        await mock.save({ transaction: t });
      }

      pocket.current_balance -= member.contribution_amount;
      if (pocket.current_balance < 0) pocket.current_balance = 0;

      const transactionData = {
        pocket_id: pocketId,
        initiator_user_id: memberId,
        type: 'Expense',
        amount: member.contribution_amount,
        destination_acc: 'BNI - [NO REKENING]',
        category: `lainnya`,
        status: 'completed',
        description: null,
        is_business_expense: false,
      }

      await Transaction.create(transactionData, { transaction: t });

      // Delete member
      const deletedCount = await PocketMember.destroy({
        where: {
          pocket_id: pocketId,
          user_id: memberId,
        },
        transaction: t,
      });

      totalDeleted += deletedCount;
    }

    await pocket.save({ transaction: t });

    if (totalDeleted === 0) {
      throw new NotFoundError("No members found to delete");
    }

    await t.commit();

    return {
      message: "Members deleted successfully",
      count: totalDeleted,
    };
  } catch (error) {
    await t.rollback();
    if (error instanceof NotFoundError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};


module.exports.leavePocket = async (pocketId, userId) => {
  const t = await sequelize.transaction();
  try {
    console.log("Leaving pocket:", pocketId, "for user:", userId);

    const member = await PocketMember.findOne({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
      transaction: t 
    })

    const [mock, pocket] = await Promise.all([
      MockSavingsAccount.findOne({
        where: {
          user_id: userId
        },
        transaction: t 
      }),
      Pocket.findOne({
        where: {
          pocket_id: pocketId
        },
        transaction: t 
      })
    ])

    if (!member) {
      throw new NotFoundError("You are not a member of this pocket");
    }

    if (member.role === "owner") {
      throw new BadRequestError("Owner pocket cannot leave the pocket, owner just can delete the pocket");
    }

    // Kurangin earmarked_balance dari mock
    mock.earmarked_balance -= member.contribution_amount;
    if (mock.earmarked_balance < 0) mock.earmarked_balance = 0;
    await mock.save({ transaction: t });

    // kurangin current balance di pocket
    pocket.current_balance -= member.contribution_amount;
    if (pocket.current_balance < 0) pocket.current_balance = 0;
    await pocket.save({ transaction: t });

    const transactionData = {
      pocket_id: pocketId,
      initiator_user_id: userId,
      type: 'Expense',
      amount: member.contribution_amount,
      destination_acc: 'BNI - [NO REKENING]',
      category: `lainnya`,
      status: 'completed',
      description: null,
      is_business_expense: false,
    }

    await Transaction.create(transactionData, { transaction: t });

    // Hapus diri sendiri dari pocket
    const deletedCount = await PocketMember.destroy({
      where: {
        pocket_id: pocketId,
        user_id: userId,
      },
      transaction: t
    })

    await t.commit();
    return {
      message: "You have left the pocket successfully"
    };
  } catch (error) {
    await t.rollback();
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
    if (isRequesterAdmin && targetMember.role == "admin") {
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

    // 0. Get pocket to check if it's a business type
    const pocket = await Pocket.findByPk(pocketId);
    if (!pocket) {
      throw new Error("Pocket not found");
    }

    // 1. Get transactions within the month
    const history = await Transaction.findAll({
      where: {
        pocket_id: pocketId,
        createdAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [["createdAt", "DESC"]],
    });

    let pemasukan = 0;
    let pengeluaran = 0;
    const groupedHistory = {};

    history.forEach((tx) => {
      const dateKey = tx.createdAt.toISOString().split("T")[0];
      const isIncoming = tx.type === 'Income';
      const transactionType = isIncoming ? 1 : 0;

      const mappedTx = {
        id: tx.id,
        type: tx.type,
        transaction_type: transactionType,
        amount: parseFloat(tx.amount) || 0,
        description: tx.description,
        is_business_expense: tx.is_business_expense || false,
        category: tx.category,
        destination_acc: tx.destination_acc,
      };

      if (!groupedHistory[dateKey]) {
        groupedHistory[dateKey] = [];
      }
      groupedHistory[dateKey].push(mappedTx);

      if (isIncoming) {
        pemasukan += mappedTx.amount;
      } else {
        pengeluaran += mappedTx.amount;
      }
    });

    const result = Object.keys(groupedHistory)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((date) => ({
        date,
        transactions: groupedHistory[date],
      }));

    // If NOT business type, return only daily transactions
    if (pocket.type !== "business") {
      return result;
    }

    // 2. If business type, calculate saldoKemarin
    const previousTransactions = await Transaction.findAll({
      where: {
        pocket_id: pocketId,
        createdAt: {
          [Op.lt]: startDate,
        },
      },
    });

    let saldoKemarin = 0;
    previousTransactions.forEach((tx) => {
      const isIncoming = tx.type === 'Income';
      const amount = parseFloat(tx.amount) || 0;
      saldoKemarin += isIncoming ? amount : -amount;
    });

    const saldoPenutupan = saldoKemarin + pemasukan - pengeluaran;

    return {
      saldoKemarin: saldoKemarin.toString(),
      saldoPenutupan: saldoPenutupan.toString(),
      pemasukan: pemasukan.toString(),
      pengeluaran: pengeluaran.toString(),
      transaksi: result,
    };
  } catch (error) {
    logger.error(error.message);
    throw new InternalServerError(error.message);
  }
};

module.exports.getLast5BusinessTransactionsForUser = async (userId, pocketId = null) => {
  try {
    const pocketWhere = { type: 'business' };
    if (pocketId) pocketWhere.id = pocketId;

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
      where: { pocket_id: { [Op.in]: businessPocketIds } },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const result = transactions.map(tx => ({
      type: tx.type,
      description: tx.description,
      amount: tx.amount,
      transaction_type: tx.type === 'Income' ? 1 : 0
    }));

    return result;
  } catch (error) {
    logger.error(error.message);
    throw new InternalServerError(error.message);
  }
};

module.exports.getBusinessPocketTransactionHistory = async (userId, { pocketId = null, duration = '30d' } = {}) => {
  try {
    const pocketWhere = { type: 'business' };
    if (pocketId) pocketWhere.id = pocketId;

    // 1. Get all business pockets the user is a member of
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

    // 2. Calculate start date based on duration
    let fromDate = new Date();
    switch (duration) {
      case '3m': fromDate = subMonths(fromDate, 3); break;
      case '6m': fromDate = subMonths(fromDate, 6); break;
      case '1y': fromDate = subYears(fromDate, 1); break;
      case '30d':
      default: fromDate = subDays(fromDate, 30); break;
    }
    fromDate = startOfDay(fromDate);

    // 3. Get transactions within the duration
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

    // 4. Get previous transactions to calculate saldoKemarin
    const previousTransactions = await Transaction.findAll({
      where: {
        pocket_id: { [Op.in]: businessPocketIds },
        createdAt: { [Op.lt]: fromDate }
      }
    });

    let saldoKemarin = 0;
    previousTransactions.forEach(tx => {
      const isIncoming = tx.type === 'Income';
      const amount = parseFloat(tx.amount) || 0;
      saldoKemarin += isIncoming ? amount : -amount;
    });

    // 5. Calculate pemasukan, pengeluaran
    let pemasukan = 0;
    let pengeluaran = 0;

    const mappedTransactions = transactions.map(tx => {
      const amount = parseFloat(tx.amount) || 0;
      const isIncoming = tx.type === 'Income';

      if (isIncoming) pemasukan += amount;
      else pengeluaran += amount;

      return {
        createdAt: tx.createdAt,
        initiator_user: tx.initiator?.name ?? null,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        destination_acc: tx.destination_acc,
        transaction_type: isIncoming ? 1 : 0
      };
    });

    const saldoPenutupan = saldoKemarin + pemasukan - pengeluaran;

    return {
      saldoKemarin: saldoKemarin.toString(),
      saldoPenutupan: saldoPenutupan.toString(),
      pemasukan: pemasukan.toString(),
      pengeluaran: pengeluaran.toString(),
      transactions: mappedTransactions
    };
  } catch (error) {
    logger.error(error.message);
    throw new InternalServerError(error.message);
  }
};

module.exports.getBEP = async (userData, pocketId) => {
  try {
    const [pocket, incomeHistory, expenseHistory, member] = await Promise.all([
      Pocket.findOne({
        where: { id: pocketId, type: 'business' },
        raw: true
      }),
      Transaction.findAll({
        where: { pocket_id: pocketId, type: 'Income' },
        order: [['updatedAt', 'DESC'], ['createdAt', 'DESC']],
        raw: true
      }),
      Transaction.findAll({
        where: { pocket_id: pocketId, type: 'Expense' },
        order: [['updatedAt', 'DESC'], ['createdAt', 'DESC']],
        raw: true
      }),
      PocketMember.findOne({
        where: {
          pocket_id: pocketId,
          user_id: userData.id,
          [Op.or]: [{ role: 'owner' }, { role: 'admin' }]
        },
        raw: true
      })
    ]);

    if (!pocket) throw new ConflictError('Pocket is not business type');
    if (!member) throw new UnauthorizedError("You're not an admin or an owner");

    const result = analyzeProfitOrLoss({
      modalAwal: pocket.target_nominal,
      incomeHistory,
      expenseHistory,
    });

    return result;
  } catch (error) {
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError
    ) throw error;

    throw new InternalServerError(error.message);
  }
};

const analyzeProfitOrLoss = ({
  modalAwal,
  incomeHistory,
  expenseHistory,
  lossProjectionRates = [0.1, 0.2]
}) => {
  const totalIncome = incomeHistory.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = expenseHistory.reduce((sum, tx) => sum + tx.amount, 0);
  const cleanProfit = totalIncome - totalExpense;

  // Group by day for daily clean profit
  const dateMap = {};

  incomeHistory.forEach(tx => {
    const date = tx.createdAt.toISOString().slice(0, 10);
    if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0 };
    dateMap[date].income += tx.amount;
  });

  expenseHistory.forEach(tx => {
    const date = tx.createdAt.toISOString().slice(0, 10);
    if (!dateMap[date]) dateMap[date] = { income: 0, expense: 0 };
    dateMap[date].expense += tx.amount;
  });

  const dailyCleanProfits = Object.values(dateMap).map(
    ({ income, expense }) => income - expense
  );

  const averageDailyCleanProfit =
    dailyCleanProfits.reduce((sum, val) => sum + val, 0) / dailyCleanProfits.length || 0;

  if (cleanProfit >= 0) {
    const profitPercentage = (cleanProfit / modalAwal) * 100;
    const daysToReachBEP = modalAwal / averageDailyCleanProfit;

    return {
      status: 'profit',
      cleanProfit,
      profitPercentage: parseFloat(profitPercentage.toFixed(2)),
      averageDailyCleanProfit: Math.round(averageDailyCleanProfit),
      estimatedDaysToBEP: Math.ceil(daysToReachBEP)
    };
  } else {
    const loss = -cleanProfit;

    const currentAverageIncome =
      incomeHistory.reduce((sum, tx) => sum + tx.amount, 0) / dailyCleanProfits.length || 0;

    const projections = lossProjectionRates.map(rate => {
      const increasedIncome = currentAverageIncome * (1 + rate);
      const projectedDailyProfit = increasedIncome - (totalExpense / dailyCleanProfits.length || 1);

      const estimatedDays = projectedDailyProfit > 0
        ? loss / projectedDailyProfit
        : Infinity;

      return {
        increaseRate: `${rate * 100}%`,
        increasedIncome: Math.round(increasedIncome),
        projectedDailyProfit: Math.round(projectedDailyProfit),
        estimatedDaysToCoverLoss: Math.ceil(estimatedDays)
      };
    });

    return {
      status: 'loss',
      loss,
      averageDailyCleanProfit: Math.round(averageDailyCleanProfit),
      projections
    };
  }
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLOR_PALETTE = ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9575cd', '#81c784', '#ffb74d'];

const groupBy = (items, keyGetter) => {
  return items.reduce((result, item) => {
    const key = keyGetter(item);
    result[key] = result[key] || [];
    result[key].push(item);
    return result;
  }, {});
};

module.exports.getAllBusinessStats = async (userId, type) => {
  try {
    if (!['overview', 'pemasukan', 'pengeluaran'].includes(type)) {
      throw new BadRequestError('Unknown type');
    }

    const earliestTransaction = await Transaction.findOne({
      where: {
        initiator_user_id: userId,
        status: 'completed'
      },
      order: [['createdAt', 'ASC']],
      attributes: ['createdAt']
    });

    if (!earliestTransaction) return [];

    const daysSinceFirst = (Date.now() - new Date(earliestTransaction.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFirst < 7) return [];

    const transactions = await Transaction.findAll({
      where: {
        initiator_user_id: userId,
        status: 'completed'
      },
      attributes: ['amount', 'type', 'createdAt', 'pocket_id'],
      include: [{ model: Pocket, as: 'pocket', attributes: ['name'] }]
    });

    if (!transactions.length) return [];

    const monthly = groupBy(transactions, trx => {
      const date = new Date(trx.createdAt);
      return `${date.getFullYear()}-${date.getMonth()}`;
    });

    const xLabels = [...new Set(Object.keys(monthly).map(k => {
      const [y, m] = k.split('-');
      return `${MONTH_NAMES[parseInt(m)]} ${y}`;
    }))].sort((a, b) => new Date(a) - new Date(b));

    const series = {};

    for (const trx of transactions) {
      const date = new Date(trx.createdAt);
      const monthKey = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
      const isIncome = trx.type === 'Income';
      const isOutcome = trx.type === 'Expense';

      if ((type === 'pemasukan' && !isIncome) || (type === 'pengeluaran' && !isOutcome)) {
        continue;
      }

      const labelKey = type === 'overview'
        ? (isIncome ? 'pemasukan' : 'pengeluaran')
        : trx.pocket?.name || 'Unnamed pocket';

      if (!series[labelKey]) {
        series[labelKey] = {
          data: new Array(xLabels.length).fill(0),
          color: COLOR_PALETTE[Object.keys(series).length % COLOR_PALETTE.length]
        };
      }

      const xIndex = xLabels.indexOf(monthKey);
      if (xIndex >= 0) {
        series[labelKey].data[xIndex] += parseFloat(trx.amount);
      }
    }

    return [{
      x: xLabels,
      label: type === 'overview' ? 'Ringkasan' : 'Per Pocket',
      series
    }];
  } catch (error) {
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};

module.exports.getPocketBusinessStats = async (userId, type, pocketId) => {
  try {
    const pocket = await Pocket.findByPk(pocketId);
    if (!pocket) throw new NotFoundError('Pocket not found');

    const earliestTransaction = await Transaction.findOne({
      where: {
        pocket_id: pocketId,
        initiator_user_id: userId,
        status: 'completed'
      },
      order: [['createdAt', 'ASC']],
      attributes: ['createdAt']
    });

    if (!earliestTransaction) return [];

    const daysSinceFirst = (Date.now() - new Date(earliestTransaction.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceFirst < 7) return [];

    const transactions = await Transaction.findAll({
      where: {
        pocket_id: pocketId,
        initiator_user_id: userId,
        status: 'completed'
      },
      attributes: ['amount', 'type', 'createdAt']
    });

    if (!transactions.length) return [];

    if (type === 'bulanan') {
      const monthly = groupBy(transactions, trx => {
        const date = new Date(trx.createdAt);
        return `${date.getFullYear()}-${date.getMonth()}`;
      });

      const xLabels = [...new Set(Object.keys(monthly).map(k => {
        const [y, m] = k.split('-');
        return `${MONTH_NAMES[parseInt(m)]} ${y}`;
      }))].sort((a, b) => new Date(a) - new Date(b));

      const series = {
        pemasukan: { data: new Array(xLabels.length).fill(0), color: '#81c784' },
        pengeluaran: { data: new Array(xLabels.length).fill(0), color: '#ff6384' }
      };

      for (const trx of transactions) {
        const date = new Date(trx.createdAt);
        const monthLabel = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
        const xIndex = xLabels.indexOf(monthLabel);
        if (xIndex < 0) continue;

        const amount = parseFloat(trx.amount) || 0;

        if (trx.type === 'Income') series.pemasukan.data[xIndex] += amount;
        if (trx.type === 'Expense') series.pengeluaran.data[xIndex] += amount;
      }

      return [{ x: xLabels, label: 'Bulanan', series }];
    }

    if (type === 'tahunan') {
      const yearly = groupBy(transactions, trx => new Date(trx.createdAt).getFullYear());
      const xLabels = Object.keys(yearly).sort();

      const series = {
        pemasukan: { data: [], color: '#81c784' },
        pengeluaran: { data: [], color: '#ff6384' }
      };

      for (const year of xLabels) {
        const trans = yearly[year];
        let income = 0, expense = 0;

        for (const trx of trans) {
          const amount = parseFloat(trx.amount) || 0;
          if (trx.type === 'Income') income += amount;
          if (trx.type === 'Expense') expense += amount;
        }

        series.pemasukan.data.push(income);
        series.pengeluaran.data.push(expense);
      }

      return [{ x: xLabels, label: 'Tahunan', series }];
    }

    return [];
  } catch (error) {
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError ||
      error instanceof UnauthorizedError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
};