const { InternalServerError, BadRequestError, NotFoundError, ConditionNotMetError, ConflictError } = require("../../helpers/error");
const logger = require("../../helpers/utils/logger");
const { sequelize, User, Pocket, PocketMember, Transaction, MockSavingsAccount, Sequelize } = require("../../models");
const { notifyPocketMembers } = require("../users/notificationModules");
const { formatCurrency } = require("../../helpers/utils/amountFormatter");

module.exports.initWithdraw = async (userId, withdrawData) => {
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
          id: withdrawData.pocket_id
        },
        transaction: t
      }),
      PocketMember.findOne({
        where: {
          pocket_id: withdrawData.pocket_id,
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

    // Check if user is a member of said pocket
    if (!user || !pocket || !member) {
      throw new NotFoundError("User/Pocket not found or user is not a member of that pocket");
    }

    // Check if balance to withdraw didnt go over the contribution amount of member
    if (withdrawData.balance > member.contribution_amount) {
      throw new ConflictError("Balance to withdraw is over your contribution");
    }

    // Reduce current_balance of said pocket
    await Pocket.increment(
      {
        // current_balance: Sequelize.literal(`current_balance - ${withdrawData.balance}`)
        current_balance: -withdrawData.balance
      },
      {
        where: {
          id: withdrawData.pocket_id,
        },
        transaction: t
      }
    )

    // Reduce the contribution amount in said pocketmember
    await PocketMember.increment(
      {
        // contribution_amount: Sequelize.literal(`contribution_amount - ${withdrawData.balance}`)
        contribution_amount: -withdrawData.balance
      },
      {
        where: {
          pocket_id: withdrawData.pocket_id,
          user_id: userId
        },
        transaction: t
      }
    )

    // Reduce the earmarked_balance in MockSavingsAccount
    await MockSavingsAccount.increment(
      {
        // earmarked_balance: Sequelize.literal(`earmarked_balance - ${withdrawData.balance}`) 
        earmarked_balance: -withdrawData.balance
      },
      {
        where: {
          user_id: userId
        },
        transaction: t
      }
    )

    // Create transaction history
    const transactionData = {
      pocket_id: withdrawData.pocket_id,
      initiator_user_id: userId,
      type: 'Expense',
      amount: withdrawData.balance,
      destination_acc: withdrawData.destination_acc || user.name,
      category: 'withdraw',
      status: 'completed',
      description: withdrawData.description || '',
      is_business_expense: false,
    }

    const result = await Transaction.create(transactionData, { transaction: t });
    
    try {
      await notifyPocketMembers({
        pocketId: withdrawData.pocket_id,
        excludeUserId: userId,
        title: `${formatCurrency(withdrawData.balance || 0)} telah ditarik dari pocket ${pocket.name}`,
        body: `${user.name} telah melakukan penarikan sebesar ${formatCurrency(withdrawData.balance || 0)} dari pocket ${pocket.name}`,
        message: `Penarikan dana berhasil dilakukan dari pocket ini.`,
        transaction: t
      })
    } catch (error) {
      logger.warn('Failed to send notification');
    }

    await t.commit();
    
    return result;
  } catch (error) {
    logger.error(error);
    await t.rollback();
    if (
      error instanceof BadRequestError ||
      error instanceof NotFoundError
    ) {
      throw error;
    }
    throw new InternalServerError(error.message);
  }
}