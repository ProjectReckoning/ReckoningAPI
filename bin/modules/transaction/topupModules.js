const { InternalServerError, BadRequestError, NotFoundError, ConditionNotMetError } = require("../../helpers/error");
const { formatCurrency } = require("../../helpers/utils/amountFormatter");
const logger = require("../../helpers/utils/logger");
const { sequelize, User, Pocket, PocketMember, Transaction, MockSavingsAccount, Sequelize } = require("../../models");
const { notifyPocketMembers } = require("../users/notificationModules");

module.exports.initTopUp = async (userId, topupData) => {
  const t = await sequelize.transaction();

  try {
    const [user, pocket, member, mockAcc] = await Promise.all([
      User.findOne({
        where: {
          id: userId
        },
        transaction: t
      }),
      Pocket.findOne({
        where: {
          id: topupData.pocket_id
        },
        transaction: t
      }),
      PocketMember.findOne({
        where: {
          pocket_id: topupData.pocket_id,
          user_id: userId
        },
        transaction: t
      }),
      MockSavingsAccount.findOne({
        where: {
          user_id: userId
        },
        transaction: t
      })
    ])

    if (!user || !pocket || !member) {
      throw new NotFoundError("User/Pocket not found or user is not a member of that pocket");
    }

    // Check if user's balance - user's earmarked balance if enough to make the transaction
    if (topupData.balance > (mockAcc.balance - mockAcc.earmarked_balance)) {
      throw new ConditionNotMetError('You dont have enough balance to complete this transaction');
    }

    // Add user's MockSavingsAccount earmarked balance
    await MockSavingsAccount.increment(
      {
        // earmarked_balance: Sequelize.literal(`earmarked_balance + ${topupData.balance}`) 
        earmarked_balance: topupData.balance
      },
      {
        where: {
          user_id: userId
        },
        transaction: t
      }
    )

    // Add balance to pocket's current_balance
    await Pocket.increment(
      {
        // current_balance: Sequelize.literal(`current_balance + ${topupData.balance}`)
        current_balance: topupData.balance
      },
      {
        where: {
          id: topupData.pocket_id,
        },
        transaction: t
      }
    )

    // Add balance to user's pocket member contribution_amount
    await PocketMember.increment(
      {
        // contribution_amount: Sequelize.literal(`contribution_amount + ${topupData.balance}`)
        contribution_amount: topupData.balance
      },
      {
        where: {
          pocket_id: topupData.pocket_id,
          user_id: userId
        },
        transaction: t
      }
    )

    // Add the transaction to Transaction table for history
    const transactionData = {
      pocket_id: topupData.pocket_id,
      initiator_user_id: userId,
      type: 'Income',
      amount: topupData.balance,
      destination_acc: topupData.destination_acc || pocket.name,
      category: 'topup',
      status: 'completed',
      description: topupData.description || '',
      is_business_expense: false,
    };

    const result = await Transaction.create(transactionData, { transaction: t });

    
    // CREATE NOTIFICATION HERE LATER
    try {
      await notifyPocketMembers({
        pocketId: topupData.pocket_id,
        excludeUserId: userId,
        title: `${formatCurrency(topupData.balance || 0)} telah masuk ke ${pocket.name}`,
        body: `${user.name} telah melakukan top up sebesar ${formatCurrency(topupData.balance || 0)} ke pocket ${pocket.name}`,
        message: `Top up berhasil ditambahkan ke pocket ini.`,
        transaction: t
      })
    } catch (error) {
      logger.warn('Failed to send notification');
    }

    await t.commit();

    return result;
  } catch (error) {
    await t.rollback();
    logger.error(error);
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError ||
      error instanceof ConditionNotMetError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}