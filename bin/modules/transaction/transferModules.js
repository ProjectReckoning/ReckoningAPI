const { BadRequestError, ConflictError, NotFoundError, InternalServerError } = require("../../helpers/error");
const logger = require("../../helpers/utils/logger");
const { AutoBudgeting, User, Pocket, PocketMember, MockSavingsAccount, TransactionApproval, Transaction, sequelize } = require("../../models");
const config = require('../../config');
const MongoDb = require('../../config/database/mongodb/db');
const mongoDb = new MongoDb(config.get('/mongoDbUrl'));
const { calculateNextRunDate, calculateNextRunDateFromSchedule, toUTCFromWIB } = require("../../helpers/utils/dateFormatter");
const { Op } = require("sequelize");
const notificationModules = require('../users/notificationModules');
const { ObjectId } = require("mongodb");
const { formatCurrency } = require("../../helpers/utils/amountFormatter");

const calculateSmartSplit = ({
  initiatorUserId,
  totalBalance,
  transferAmount,
  members
}) => {
  const baseSplits = members.map(member => {
    const percentage = totalBalance > 0
      ? Number(member.contribution_amount) / Number(totalBalance)
      : 0;

    const idealShare = transferAmount * percentage;
    const flooredShare = Math.floor(idealShare / 1000) * 1000;

    return {
      user_id: member.user_id,
      flooredShare,
      idealShare,
      contribution_amount: member.contribution_amount
    };
  });

  const resultMap = new Map(); // user_id => jumlah yang dibebankan
  const usedContribution = new Map(); // user_id => total kontribusi yang sudah dipakai

  baseSplits.forEach(({ user_id, flooredShare }) => {
    resultMap.set(user_id, flooredShare);
    usedContribution.set(user_id, flooredShare);
  });

  const totalRounded = Array.from(resultMap.values()).reduce((a, b) => a + b, 0);
  let remaining = transferAmount - totalRounded;

  const initiator = baseSplits.find(m => m.user_id === initiatorUserId);
  const initiatorMax = initiator ? initiator.contribution_amount : 0;
  const initiatorUsed = Math.min(initiatorMax - (usedContribution.get(initiatorUserId) || 0), remaining);

  if (initiatorUsed > 0) {
    resultMap.set(initiatorUserId, resultMap.get(initiatorUserId) + initiatorUsed);
    usedContribution.set(initiatorUserId, (usedContribution.get(initiatorUserId) || 0) + initiatorUsed);
    remaining -= initiatorUsed;
  }

  if (remaining <= 0) {
    return Array.from(resultMap, ([user_id, amount]) => ({ user_id, amount }));
  }

  const eligibleMembers = baseSplits.map(m => m.user_id);
  const initiatorIndex = eligibleMembers.indexOf(initiatorUserId);
  const roundRobinOrder = [
    ...eligibleMembers.slice(initiatorIndex),
    ...eligibleMembers.slice(0, initiatorIndex)
  ];

  // Round robin bagi remaining
  while (remaining >= 1000) {
    let assigned = false;

    for (const uid of roundRobinOrder) {
      const currentUsed = usedContribution.get(uid) || 0;
      const maxAllowed = baseSplits.find(m => m.user_id === uid)?.contribution_amount || 0;

      if (currentUsed + 1000 <= maxAllowed) {
        resultMap.set(uid, resultMap.get(uid) + 1000);
        usedContribution.set(uid, currentUsed + 1000);
        remaining -= 1000;
        assigned = true;
        if (remaining < 1000) break;
      }
    }

    // Tidak ada yang bisa menanggung 1000 lagi
    if (!assigned) break;
  }

  if (remaining > 0 && remaining < 1000) {
    for (const uid of roundRobinOrder) {
      const currentUsed = usedContribution.get(uid) || 0;
      const maxAllowed = baseSplits.find(m => m.user_id === uid)?.contribution_amount || 0;

      if (currentUsed + remaining <= maxAllowed) {
        resultMap.set(uid, resultMap.get(uid) + remaining);
        usedContribution.set(uid, currentUsed + remaining);
        remaining = 0;
        break;
      }
    }
  }

  return Array.from(resultMap, ([user_id, amount]) => ({ user_id, amount }));
}

const createPendingApproval = async ({ userData, transferData, approvers, pocket, t }) => {
  const transactionData = {
    pocket_id: transferData.pocket_id,
    initiator_user_id: userData.id,
    type: 'Expense',
    amount: transferData.balance,
    destination_acc: 'BNI - [NO REKENING]',
    category: transferData.category || 'transfer',
    status: 'pending',
    description: transferData.description || '',
    is_business_expense: true
  };

  const transaction = await Transaction.create(transactionData, { transaction: t });

  mongoDb.setCollection('pocketSplitResult');
  await mongoDb.insertOne({ transaction_id: transaction.id, splitResult: approvers });

  for (const { user_id, amount } of approvers) {
    if (user_id === userData.id) continue;

    await TransactionApproval.create({
      transaction_id: transaction.id,
      approver_user_id: user_id,
      status: 'pending'
    }, { transaction: t });

    const notifData = {
      date: new Date(),
      type: 'transaction_approval_needed',
      message: `${userData.name} memerlukan persetujuanmu untuk transaksinya. Transaksi sebesar ${formatCurrency(amount || 0)} akan ditarik dari saldomu`,
      requestedBy: {
        id: userData.id,
        name: userData.name
      },
      transaction_id: transaction.id,
      amount,
      pocket: pocket.get({ plain: true }),
      user_id,
      transaction_detail: transaction.get({ plain: true }),
      responded: false,
      response: null
    };

    const pushToken = await notificationModules.getPushToken(user_id);
    const notifMessage = notificationModules.setNotificationData({
      pushToken,
      title: `Butuh persetujuan untuk transaksi ${userData.name}`,
      body: notifData.message,
      data: notifData
    });

    await notificationModules.pushNotification(notifMessage);
    mongoDb.setCollection('notifications');
    await mongoDb.insertOne(notifMessage[0]);
  }

  return transaction.get({ plain: true });
}

module.exports.initTransfer = async (userData, transferData) => {
  const t = await sequelize.transaction();
  try {
    logger.info("Querying user, pocket, member and mock account");
    const [user, pocket, member, mockAcc] = await Promise.all([
      User.findOne({
        where: {
          id: userData.id
        },
        transaction: t
      }),
      Pocket.findOne({
        where: {
          id: transferData.pocket_id
        },
        transaction: t
      }),
      PocketMember.findOne({
        where: {
          pocket_id: transferData.pocket_id,
          user_id: userData.id
        },
        transaction: t
      }),
      MockSavingsAccount.findOne({
        where: {
          user_id: userData.id
        },
        transaction: t
      })
    ])

    if (!user || !pocket || !member) {
      throw new NotFoundError("User/Pocket not found or user is not a member of that pocket");
    }

    // Check if the current_balance of the pocket is enough to make the transaction
    if (pocket.current_balance < transferData.balance) {
      throw new ConflictError("Pocket's current balance is not enough to make the transaction");
    }

    const isBusiness = pocket.type === 'business';
    const isInitiatorAdmin = ['admin', 'owner'].includes(member.role);

    let result = {};

    if (isBusiness && isInitiatorAdmin) {
      logger.info("Is Business and Is Admin")
      logger.info("Query pocket's member")
      const adminMembers = await PocketMember.findAll({
        where: {
          pocket_id: transferData.pocket_id,
          role: ['admin', 'owner']
        },
        attributes: ['user_id', 'contribution_amount'],
        transaction: t
      });

      if (adminMembers.length === 1) {
        // Only initiator is admin/owner → direct transfer
        logger.info("Execute direct transfer");
        const resultDirect = await this.executeDirectTransfer(userData, transferData, t, true);
        await t.commit();
        return resultDirect;
      } else {
        // Multiple admins/owners → always split (even if initiator can cover it)
        logger.info("Calculate smart split")
        const splitResult = calculateSmartSplit({
          initiatorUserId: userData.id,
          totalBalance: pocket.current_balance,
          transferAmount: transferData.balance,
          members: adminMembers
        });

        const totalSplit = splitResult.reduce((a, b) => a + b.amount, 0);
        if (totalSplit < transferData.balance) {
          throw new ConflictError("Unable to distribute full transfer amount across admins/owners");
        }

        logger.info("Send approval notifications to all admins")
        const resultPending = await createPendingApproval({
          userData,
          transferData,
          approvers: splitResult,
          pocket,
          t
        });
        await t.commit();
        return resultPending;
      }
    }

    // If the pocket is business and the initiator is not admin/owner → route to admin approval
    if (isBusiness && !isInitiatorAdmin) {
      logger.info("Is business and not admin")
      logger.info("Querying pocket's members");
      const approverMembers = await PocketMember.findAll({
        where: {
          pocket_id: transferData.pocket_id,
          role: ['admin', 'owner']
        },
        attributes: ['user_id', 'contribution_amount']
      });

      if (approverMembers.length === 0) {
        throw new ConflictError("No admin or owner found for business pocket");
      }

      // If only one admin/owner, send approval to them only
      if (approverMembers.length === 1) {
        const approver = approverMembers[0];
        logger.info("Send approval to one admin");
        const resultPending = await createPendingApproval({
          userData,
          transferData,
          approvers: [approver],
          pocket,
          t
        });
        await t.commit();
        return resultPending;
      }

      // Multiple admins/owners — split using calculateSmartSplit
      logger.info("Calculate smart split");
      const splitResult = calculateSmartSplit({
        initiatorUserId: userData.id, // not included in split
        totalBalance: pocket.current_balance,
        transferAmount: transferData.balance,
        members: approverMembers
      });

      const totalSplit = splitResult.reduce((a, b) => a + b.amount, 0);
      if (totalSplit < transferData.balance) {
        throw new ConflictError("Unable to distribute full transfer amount across admins/owners");
      }

      logger.info("Send approvals to all admin")
      const resultPending = await createPendingApproval({
        userData,
        transferData,
        approvers: splitResult,
        pocket,
        t
      });
      await t.commit();
      return resultPending;
    }

    // Check if user's contribution amount in pocket is enough to make the transaction
    // If not, then calculate the percentage of contribution for each member of the pocket
    // CASE 1: Initiator can fully cover
    logger.info("Not business");
    if (member.contribution_amount >= transferData.balance) {
      const is_business = pocket.type == 'business';
      logger.info("Execute direct transfer")
      const resultDirect = await this.executeDirectTransfer(userData, transferData, t, is_business);
      await t.commit();
      return resultDirect;
    } else {
      // CASE 2: Initiator needs help — SmartSplit + apply to multiple members
      logger.info("Amount is above contribution");
      logger.info("Querying pocket's members");
      const members = await PocketMember.findAll({
        where: { pocket_id: transferData.pocket_id },
        attributes: ['user_id', 'contribution_amount'],
        transaction: t
      });

      logger.info("Calculate smart split");
      const splitResult = calculateSmartSplit({
        initiatorUserId: userData.id,
        totalBalance: pocket.current_balance,
        transferAmount: transferData.balance,
        members
      });

      const totalSplit = splitResult.reduce((a, b) => a + b.amount, 0);
      if (totalSplit < transferData.balance) {
        throw new ConflictError("Unable to distribute full transfer amount across members");
      }


      // Create transaction log
      logger.info("Create transaction log");
      const transactionData = {
        pocket_id: transferData.pocket_id,
        initiator_user_id: userData.id,
        type: 'Expense',
        amount: transferData.balance,
        destination_acc: transferData.destination_acc || 'BNI - [NO REKENING MOCK]',
        category: transferData.category ?? 'transfer',
        status: 'pending',
        description: transferData.description || '',
        is_business_expense: false
      };

      logger.info("Insert the transaction log");
      result = await Transaction.create(transactionData, { transaction: t });

      // Save split result to mongo
      logger.info("Save split data to mongo");
      const pocketSplitData = {
        transaction_id: result.id,
        splitResult
      }
      mongoDb.setCollection('pocketSplitResult');
      const splitData = await mongoDb.insertOne(pocketSplitData);
      result = result.get({ plain: true });
      result.splitData = splitData.data.splitResult;

      // Send approval notification
      logger.info("Send approval notifications");
      for (const { user_id, amount } of splitResult) {
        if (user_id === userData.id) continue;

        const approvalData = {
          status: 'pending',
          transaction_id: result.id,
          approver_user_id: user_id,
        }

        logger.info("Create transaction approval data")
        await TransactionApproval.create(approvalData, { transaction: t });

        const notifData = {
          date: new Date(),
          type: 'transaction_approval_needed',
          message: `${userData.name} memerlukan persetujuanmu untuk transaksinya. Transaksi sebesar ${formatCurrency(amount || 0)} akan ditarik dari saldomu, kamu bisa menerima atau menolaknya`,
          requestedBy: {
            id: userData.id,
            name: userData.name,
          },
          transaction_id: result.id,
          amount,
          pocket: pocket.get({ plain: true }),
          user_id: user_id,
          transaction_detail: result,
          responded: false,
          response: null,
        }

        logger.info("Send notifications");
        const pushToken = await notificationModules.getPushToken(user_id);
        const notifMessage = notificationModules.setNotificationData({
          pushToken,
          title: `Butuh persetujuan untuk transaksi ${userData.name}`,
          body: `${userData.name} memerlukan persetujuanmu untuk transaksinya. Transaksi sebesar ${formatCurrency(amount || 0)} akan ditarik dari saldomu, kamu bisa menerima atau menolaknya`,
          data: notifData
        })

        await notificationModules.pushNotification(notifMessage);

        logger.info("Save notifications data");
        mongoDb.setCollection('notifications');
        await mongoDb.insertOne(notifMessage[0]);
      }
    }

    await t.commit();
    return result.get?.({ plain: true }) || result;
  } catch (error) {
    await t.rollback();
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.executeDirectTransfer = async (userData, transferData, t, is_business = false) => {
  await Promise.all([
    PocketMember.increment(
      {
        contribution_amount: -transferData.balance
      },
      {
        where: {
          user_id: userData.id,
          pocket_id: transferData.pocket_id
        },
        transaction: t
      }
    ),
    Pocket.increment(
      {
        current_balance: -transferData.balance
      },
      {
        where: {
          id: transferData.pocket_id
        },
        transaction: t
      }
    ),
    MockSavingsAccount.increment(
      {
        balance: -transferData.balance,
        earmarked_balance: -transferData.balance
      },
      {
        where: { user_id: userData.id },
        transaction: t
      }
    )
  ]);

  const transaction = await Transaction.create(
    {
      pocket_id: transferData.pocket_id,
      initiator_user_id: userData.id,
      type: 'Expense',
      amount: transferData.balance,
      destination_acc: transferData.destination_acc || 'BNI - [NO REKENING MOCK]',
      category: transferData.category || 'transfer',
      status: 'completed',
      description: transferData.description || '',
      is_business_expense: is_business
    },
    { transaction: t }
  )

  return transaction;
};

module.exports.executeSplitTransfer = async (trxId, transferData, splitResult, t) => {
  // Apply reductions to each contributing user
  logger.info('getting to split transfer');
  logger.info(transferData);
  logger.info(splitResult);
  for (const { user_id, amount } of splitResult) {
    await Promise.all([
      PocketMember.increment(
        { contribution_amount: -amount },
        {
          where: {
            user_id,
            pocket_id: transferData.pocket_id
          },
          transaction: t
        }
      ),
      MockSavingsAccount.increment(
        {
          balance: -amount,
          earmarked_balance: -amount
        },
        {
          where: { user_id },
          transaction: t
        }
      )
    ]);
  }

  // Reduce pocket balance
  await Pocket.increment(
    { current_balance: -transferData.balance },
    {
      where: { id: transferData.pocket_id },
      transaction: t
    }
  );

  // Update transaction log
  const trxData = await Transaction.findByPk(trxId, { transaction: t });

  const result = await trxData.update({ status: 'completed' }, { transaction: t });

  return result;
}

module.exports.respondTransfer = async (userData, approvalData) => {
  const t = await sequelize.transaction();
  try {
    const transactionData = await Transaction.findByPk(approvalData.transactionId, { transaction: t });

    if (!transactionData) {
      throw new NotFoundError('Transaction not found');
    }

    const transactionApprovalDataUser = await TransactionApproval.findOne({
      where: {
        transaction_id: approvalData.transactionId,
        approver_user_id: userData.id,
        status: 'pending',
      },
      transaction: t
    });

    if (!transactionApprovalDataUser) {
      throw new NotFoundError('Approval data not found or user already responded');
    }

    mongoDb.setCollection('pocketSplitResult');
    const pocketSplit = await mongoDb.findOne({ transaction_id: Number(approvalData.transactionId) });
    logger.info(pocketSplit);
    logger.info(approvalData.transactionId);

    if (!pocketSplit?.data?.splitResult) {
      throw new NotFoundError('Split result not found for this transaction');
    }

    // Check if current user is in splitResult
    const isInSplit = pocketSplit.data.splitResult.some(sr => sr.user_id === userData.id);

    if (!isInSplit) {
      throw new ConflictError('You are not authorized to approve this transaction');
    }

    const approved = approvalData.status === 'accepted' ? 'approved' : 'rejected';
    const result = await transactionApprovalDataUser.update(
      { status: approved },
      { transaction: t }
    );

    const transactionApprovalData = await TransactionApproval.findAll({
      where: {
        transaction_id: approvalData.transactionId,
        status: 'pending',
      },
      transaction: t
    });

    mongoDb.setCollection('notifications')
    await mongoDb.upsertOne({
      'data.user_id': Number(userData.id),
      'data.transaction_id': Number(approvalData.transactionId),
    }, {
      $set: {
        'data.responded': true,
        'data.response': approvalData.status
      }
    })

    let message = `User has responded with ${approvalData.status}`;
    if (approvalData.status === 'rejected') {
      // Update transaksi menjadi 'rejected'
      const result = await transactionData.update(
        { status: 'rejected' },
        { transaction: t }
      );

      try {
        const notifData = {
          date: new Date(),
          type: 'information',
          message: `${userData.name} menolak permintaanmu. Transaksi telah dibatalkan.`,
          user_id: transactionData.initiator_user_id
        }
        const pushToken = await notificationModules.getPushToken(transactionData.initiator_user_id);
        const notifMessage = notificationModules.setNotificationData({
          pushToken,
          title: `Permintaan transfermu ditolak`,
          body: `${userData.name} menolak permintaanmu. Transaksi telah dibatalkan.`,
          data: notifData
        });
        await notificationModules.pushNotification(notifMessage);

        mongoDb.setCollection('notifications');
        await mongoDb.insertOne(notifMessage[0]);
      } catch (error) {
        logger.info('Transaction has been rejected');
      }

      return { result, message };
    }

    if (transactionApprovalData.length === 0) {
      const transferData = {
        balance: transactionData.amount,
        pocket_id: transactionData.pocket_id,
      }
      logger.info('all user already accepted');

      if (transactionData.status !== 'pending') {
        throw new ConflictError('This transaction has already been processed.');
      }

      await this.executeSplitTransfer(approvalData.transactionId, transferData, pocketSplit.data.splitResult, t);
      message = `User has responded with ${approvalData.status}, and transfer has been done.`;

      mongoDb.setCollection('notifications')
      const notifList = await mongoDb.findMany({
        'data.transaction_detail.id': Number(approvalData.transactionId)
      })

      logger.info(notifList);

      for (const notif of notifList.data) {
        mongoDb.upsertOne({
          _id: new ObjectId(notif._id)
        }, {
          $set: {
            'data.transaction_detail.status': 'completed'
          }
        })
      }

      try {
        const notifData = {
          date: new Date(),
          type: 'information',
          message: `${userData.name} menerima permintaanmu. Transaksi telah selesai.`,
          user_id: transactionData.initiator_user_id
        }
        const pushToken = await notificationModules.getPushToken(transactionData.initiator_user_id);
        const notifMessage = notificationModules.setNotificationData({
          pushToken,
          title: `Permintaan transfermu diterima`,
          body: `${userData.name} menerima permintaanmu. Transaksi telah selesai.`,
          data: notifData
        });
        await notificationModules.pushNotification(notifMessage);

        mongoDb.setCollection('notifications');
        await mongoDb.insertOne(notifMessage[0]);
      } catch (error) {
        logger.info('Transaction has been accepted');
      }
    }

    await t.commit();
    return { result, message };
  } catch (error) {
    await t.rollback();
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.setTransferSchedule = async (userData, scheduleData) => {
  const t = await sequelize.transaction();
  try {
    const [user, pocket, member] = await Promise.all([
      User.findOne({
        where: {
          id: userData.id
        },
        transaction: t
      }),
      Pocket.findOne({
        where: {
          id: scheduleData.pocket_id,
          type: 'business'
        },
        transaction: t
      }),
      PocketMember.findOne({
        where: {
          pocket_id: scheduleData.pocket_id,
          user_id: userData.id
        },
        transaction: t
      }),
    ])

    if (!user || !pocket || !member) {
      throw new NotFoundError("User/Pocket not found or user is not a member of that pocket");
    }

    // Check if the current_balance of the pocket is enough to make the transaction
    if (pocket.current_balance < scheduleData.balance) {
      throw new ConflictError("Pocket's current balance is not enough to make the transaction");
    }

    // Create schedule transfer in autobudget
    // set the next_run_date with the start_date, start_month, start_year
    const nextRunDate = calculateNextRunDateFromSchedule({
      date: scheduleData.date,
      month_start: scheduleData.month_start,
      year_start: scheduleData.year_start
    });

    const data = {
      user_id: userData.id,
      pocket_id: scheduleData.pocket_id,
      recurring_amount: scheduleData.balance,
      treshold_amount: 0,
      status: 'active',
      category: scheduleData.category,
      is_active: true,
      schedule_type: 'monthly',
      schedule_value: scheduleData.date,
      next_run_date: nextRunDate,
    }
    const scheduled = await AutoBudgeting.create(data, { transaction: t });

    // Save start date and end date in mongo
    mongoDb.setCollection('scheduledTransferDate');
    await mongoDb.insertOne({
      auto_budget_id: scheduled.id,
      destination: scheduleData.destination,
      user_id: userData.id,
      pocket_id: scheduleData.pocket_id,
      start_date: calculateNextRunDateFromSchedule({
        date: scheduleData.date,
        month_start: scheduleData.month_start,
        year_start: scheduleData.year_start
      }),
      end_date: calculateNextRunDateFromSchedule({
        date: scheduleData.date,
        month_start: scheduleData.month_end,
        year_start: scheduleData.year_end
      }),
    })

    // commit
    await t.commit();

    return scheduled;
  } catch (error) {
    await t.rollback();
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.processRecurringAutoTransfer = async (budget) => {
  const t = await sequelize.transaction();
  try {
    const account = await MockSavingsAccount.findOne({ where: { user_id: budget.user_id }, transaction: t });
    if (!account || account.balance < budget.recurring_amount) {
      // I want it to change the next_run_date to tomorrow the autobudget in db
      return;
    }

    const trx = await Transaction.create({
      pocket_id: budget.pocket_id,
      initiator_user_id: budget.user_id,
      type: 'Expense',
      amount: budget.recurring_amount,
      destination_acc: 'BNI - [NO REKENING]',
      category: 'autobudget',
      status: 'pending',
      is_business_expense: true,
    }, { transaction: t });

    const members = await PocketMember.findAll({
      where: {
        pocket_id: budget.pocket_id,
        [Op.or]: [
          { role: 'admin' },
          { role: 'owner' },
        ],
      },
      attributes: ['user_id', 'contribution_amount'],
      transaction: t
    })

    const splitResult = calculateSmartSplit({
      initiatorUserId: budget.user_id,
      totalBalance: budget.recurring_amount,
      transferAmount: budget.recurring_amount,
      members
    })

    await this.executeSplitTransfer(trx.id, {
      pocket_id: budget.pocket_id,
      balance: budget.recurring_amount
    }, splitResult, t);


    budget.last_triggered_at = new Date();

    mongoDb.setCollection('scheduledTransferDate');
    const dateSchedule = await mongoDb.findOne({
      auto_budget_id: Number(budget.id),
      user_id: Number(budget.user_id),
      pocket_id: Number(budget.pocket_id),
    });

    if (new Date(dateSchedule.data.end_date) <= new Date()) {
      budget.status = 'inactive';
      budget.is_active = false;
    }

    budget.next_run_date = calculateNextRunDate(budget.schedule_type, budget.schedule_value);
    await budget.save({ transaction: t });
    try {
      await notificationModules.notifyPocketMembers({
        pocketId: budget.pocket_id,
        targetUserId: budget.user_id,
        title: `${formatCurrency(topupData.balance || 0)} telah di transfer dari ${pocket.name} melalui schedule transfer anda`,
        body: `Anda telah berhasil melakukan transfer sebesar ${formatCurrency(topupData.balance || 0)} dari pocket ${pocket.name} melalui schedule transfer anda`,
        message: `Transfer berhasil dilakukan dari pocket ini.`,
        transaction: t
      })
    } catch (error) {
      logger.warn('Failed to send notification');
    }

    await t.commit();
  } catch (err) {
    await t.rollback();
    logger.error('Recurring budget error:', err);
  }
};

const getTrfSchedForAdmin = async (pocket_id) => {
  const scheduleTransfer = await AutoBudgeting.findAll({
    where: {
      pocket_id: pocket_id,
    },
    attributes: [
      'id',
      'recurring_amount',
      'next_run_date',
      'status',
      'category'
    ],
    order: [['next_run_date', 'ASC']],
    raw: true
  });

  return scheduleTransfer;
}

const getTrfSchedForMember = async (userData, pocket_id) => {
  const scheduleTransfer = await AutoBudgeting.findAll({
    where: {
      user_id: userData.id,
      pocket_id: pocket_id,
    },
    attributes: [
      'id',
      'recurring_amount',
      'next_run_date',
      'status',
      'category'
    ],
    order: [['next_run_date', 'ASC']],
    raw: true
  });

  return scheduleTransfer;
}

module.exports.getTransferSchedule = async (userData, pocket_id) => {
  try {
    const [user, pocket, member] = await Promise.all([
      User.findByPk(userData.id),
      Pocket.findOne({
        where: {
          id: pocket_id,
          type: 'business'
        }
      }),
      PocketMember.findOne({
        where: {
          user_id: userData.id,
          pocket_id: pocket_id
        }
      })
    ]);

    if (!user || !pocket || !member) {
      throw new NotFoundError('User/Pocket not found');
    }

    let scheduleTransfer;
    if (member.role !== 'admin' && member.role !== 'owner') {
      scheduleTransfer = await getTrfSchedForMember(user, pocket_id);
    } else {
      scheduleTransfer = await getTrfSchedForAdmin(pocket_id);
    }

    mongoDb.setCollection('scheduledTransferDate');
    const ids = scheduleTransfer.map(s => s.id);
    const mongoResult = await mongoDb.findManyByFieldInArray('auto_budget_id', ids);

    logger.info(mongoResult);

    const mongoMap = new Map();
    mongoResult.data.forEach(doc => {
      mongoMap.set(doc.auto_budget_id, doc.data || null);
    });

    const result = scheduleTransfer.map(sched => ({
      ...sched,
      detail: mongoMap.get(sched.id) || null
    }));

    return result;
  } catch (error) {
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.getDetailTransferSchedule = async (userData, pocket_id, schedule_id) => {
  try {
    const [user, pocket, member] = await Promise.all([
      User.findByPk(userData.id),
      Pocket.findOne({
        where: {
          id: pocket_id,
          type: 'business'
        }
      }),
      PocketMember.findOne({
        where: {
          user_id: userData.id,
          pocket_id: pocket_id,
          [Op.or]: [
            { role: 'admin' },
            { role: 'owner' }
          ]
        }
      })
    ]);

    if (!user || !pocket || !member) {
      throw new NotFoundError('User/Pocket not found or user is not an admin/owner of this pocket');
    }

    const scheduleTransfer = await AutoBudgeting.findOne({
      where: {
        id: schedule_id,
        pocket_id: pocket_id,
      },
      attributes: ['id', 'recurring_amount', 'next_run_date', 'status', 'category'],
      raw: true
    });

    if (!scheduleTransfer) {
      throw new NotFoundError('Schedule not found');
    }

    mongoDb.setCollection('scheduledTransferDate');
    const mongo = await mongoDb.findOne({ auto_budget_id: Number(scheduleTransfer.id) });

    return {
      ...scheduleTransfer,
      detail: mongo?.data || null
    };
  } catch (error) {
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}

module.exports.deleteTransferSchedule = async (userData, pocket_id, schedule_id) => {
  const t = await sequelize.transaction();
  try {
    const existAutoBudget = await AutoBudgeting.findOne({
      where: {
        id: schedule_id,
        user_id: userData.id,
        pocket_id,
        status: 'active',
        is_active: true
      },
      order: [
        ['updatedAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      transaction: t
    });

    existAutoBudget.status = 'inactive';
    existAutoBudget.is_active = false;
    await existAutoBudget.save({ transaction: t });

    await t.commit();
    return existAutoBudget;
  } catch (error) {
    await t.rollback();
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof ConflictError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}