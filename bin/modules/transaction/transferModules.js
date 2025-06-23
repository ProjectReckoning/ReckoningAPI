const { BadRequestError, ConflictError, NotFoundError, InternalServerError } = require("../../helpers/error");
const logger = require("../../helpers/utils/logger");
const { User, Pocket, PocketMember, MockSavingsAccount, TransactionApproval, Transaction, sequelize } = require("../../models");
const config = require('../../config');
const MongoDb = require('../../config/database/mongodb/db');
const mongoDb = new MongoDb(config.get('/mongoDbUrl'));

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

  return Array.from(resultMap, ([user_id, amount]) => ({ user_id, amount }));
}

module.exports.initTransfer = async (userData, transferData) => {
  const t = await sequelize.transaction();
  try {
    const [user, pocket, member, mockAcc] = await Promise.all([
      User.findOne({
        where: {
          id: userData.id
        }
      }),
      Pocket.findOne({
        where: {
          id: transferData.pocket_id
        }
      }),
      PocketMember.findOne({
        where: {
          pocket_id: transferData.pocket_id,
          user_id: userData.id
        }
      }),
      MockSavingsAccount.findOne({
        where: {
          user_id: userData.id
        }
      })
    ])

    if (!user || !pocket || !member) {
      throw new NotFoundError("User/Pocket not found or user is not a member of that pocket");
    }

    // Check if the current_balance of the pocket is enough to make the transaction
    if (pocket.current_balance < transferData.balance) {
      throw new ConflictError("Pocket's current balance is not enough to make the transaction");
    }

    // Check if user's contribution amount in pocket is enough to make the transaction
    // If not, then calculate the percentage of contribution for each member of the pocket
    // CASE 1: Initiator can fully cover
    let result = {};
    if (member.contribution_amount >= transferData.balance) {
      result = await this.executeDirectTransfer(userData, transferData, t);
    } else {
      // CASE 2: Initiator needs help — SmartSplit + apply to multiple members
      const members = await PocketMember.findAll({
        where: { pocket_id: transferData.pocket_id },
        attributes: ['user_id', 'contribution_amount']
      });

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
      const transactionData = {
        pocket_id: transferData.pocket_id,
        initiator_user_id: userData.id,
        type: 'Transfer',
        amount: transferData.balance,
        purpose: 'Transfer ke [REKENING SESEORANG]',
        status: 'pending',
        description: transferData.description || '',
        is_business_expense: false
      };

      result = await Transaction.create(transactionData, { transaction: t });

      // Save split result to mongo
      const pocketSplitData = {
        transaction_id: result.id,
        splitResult
      }
      mongoDb.setCollection('pocketSplitResult');
      const splitData = await mongoDb.insertOne(pocketSplitData);

      result.splitData = splitData.data.splitResult;

      // Send approval notification
      for (const { user_id, amount } of splitResult) {
        const approvalData = {
          status: 'pending',
          transaction_id: result.id,
          approver_user_id: user_id,
        }

        await TransactionApproval.create(approvalData, { transaction: t });

        const pushToken = await notificationModules.getPushToken(user_id);
        const notifMessage = notificationModules.setNotificationData({
          pushToken,
          title: `Needs approval for ${userData.name} transaction`,
          body: `${userData.name} needs your approval for his transaction. ${amount} will be withdrawn from your balance, you could accept or reject it`,
          data: {
            // Fill the rest later
          }
        })

        await notificationModules.pushNotification(notifMessage);
      }
    }

    await t.commit();
    return result;
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

module.exports.executeDirectTransfer = async (userData, transferData, t) => {
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
      type: 'Transfer',
      amount: transferData.balance,
      purpose: 'Transfer ke [REKENING SESEORANG]',
      status: 'completed',
      description: transferData.description || '',
      is_business_expense: false
    },
    { transaction: t }
  )

  return transaction;
};

module.exports.executeSplitTransfer = async (trxId, transferData, splitResult, t) => {
  // Apply reductions to each contributing user
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
  const trxData = await Transaction.findByPk(trxId);

  const result = await trxData.update({ status: 'completed' }, { transaction: t });

  return result;
}

module.exports.respondTransfer = async (userData, approvalData) => {
  const t = await sequelize.transaction();
  try {
    const transactionData = await Transaction.findByPk(approvalData.transactionId);

    if (!transactionData) {
      throw new NotFoundError('Transaction not found');
    }

    const transactionApprovalDataUser = await TransactionApproval.findOne({
      where: {
        transaction_id: approvalData.transactionId,
        approver_user_id: userData.id,
        status: 'pending',
      }
    });

    if (!transactionApprovalDataUser) {
      throw new NotFoundError('Approval data not found or user already responded');
    }

    mongoDb.setCollection('pocketSplitResult');
    const pocketSplit = await mongoDb.findOne({ transaction_id: approvalData.transactionId });

    if (!pocketSplit?.data?.splitResult) {
      throw new NotFoundError('Split result not found for this transaction');
    }

    // Check if current user is in splitResult
    const isInSplit = pocketSplit.data.splitResult.some(sr => sr.user_id === userData.id);

    if (!isInSplit) {
      throw new ConflictError('You are not authorized to approve this transaction');
    }

    const result = await transactionApprovalDataUser.update(
      { status: approvalData.status },
      { transaction: t }
    );

    const transactionApprovalData = await TransactionApproval.findAll({
      where: {
        transaction_id: approvalData.transactionId,
        status: 'pending',
      }
    });

    let message = `User has responded with ${approvalData.status}`;
    if (approvalData.status === 'rejected') {
      // Update transaksi menjadi 'rejected'
      const result = await transactionData.update(
        { status: 'rejected' },
        { transaction: t }
      );

      try {
        const pushToken = await notificationModules.getPushToken(transactionData.initiator_user_id);
        const notifMessage = notificationModules.setNotificationData({
          pushToken,
          title: `Your transfer request was rejected`,
          body: `${userData.name} rejected your request. Transaction has been cancelled.`,
          data: {
            transaction_id: transactionData.id,
            // Fill the rest later
          }
        });
        await notificationModules.pushNotification(notifMessage);
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

      if (transactionData.status !== 'pending') {
        throw new ConflictError('This transaction has already been processed.');
      }

      await this.executeSplitTransfer(approvalData.transactionId, transferData, pocketSplit.data.splitResult, t);
      message = `User has responded with ${approvalData.status}, and transfer has been done.`;
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