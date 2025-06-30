const { Op } = require("sequelize");
const { InternalServerError, BadRequestError, NotFoundError, ConflictError } = require("../../helpers/error");
const { calculateNextRunDate } = require("../../helpers/utils/dateFormatter");
const logger = require("../../helpers/utils/logger");
const { AutoBudgeting, sequelize, Pocket, PocketMember, MockSavingsAccount, Transaction } = require('../../models');
const { processRecurringAutoTransfer } = require("./transferModules");

const processRecurringAutoBudget = async (budget) => {
  const t = await sequelize.transaction();
  try {
    const account = await MockSavingsAccount.findOne({ where: { user_id: budget.user_id } });
    if (!account || account.balance < budget.recurring_amount) {
      // I want it to delete the autobudget in db
      await t.rollback();
      await AutoBudgeting.destroy({ where: { id: budget.id } })
      return;
    }

    account.earmarked_balance += budget.recurring_amount;
    await account.save({ transaction: t });

    const pocket = await Pocket.findByPk(budget.pocket_id);
    pocket.current_balance += budget.recurring_amount;
    await pocket.save({ transaction: t });

    const member = await PocketMember.findOne({ where: { user_id: budget.user_id, pocket_id: budget.pocket_id } });
    member.contribution_amount += budget.recurring_amount;
    await member.save({ transaction: t });

    await Transaction.create({
      pocket_id: budget.pocket_id,
      initiator_user_id: budget.user_id,
      type: 'Topup',
      purpose: 'Auto budget recurring topup',
      amount: budget.recurring_amount,
      status: 'completed',
      is_business_expense: false,
    }, { transaction: t });

    budget.last_triggered_at = new Date();
    if (budget.schedule_type !== 'once') {
      budget.next_run_date = calculateNextRunDate(budget.schedule_type, budget.schedule_value);
    } else {
      budget.status = 'completed';
      budget.is_active = false;
    }
    await budget.save({ transaction: t });

    await t.commit();
  } catch (err) {
    await t.rollback();
    logger.error('Recurring budget error:', err);
  }
}

const getAutoBudgets = async (pocketTypeCondition) => {
  const now = new Date();
  return AutoBudgeting.findAll({
    where: {
      is_active: true,
      status: 'active',
      recurring_amount: { [Op.gt]: 0 },
      next_run_date: { [Op.lte]: now }
    },
    include: [
      {
        model: Pocket,
        required: true,
        where: pocketTypeCondition
      }
    ]
  });
};

module.exports.runAutoBudgetJob = async () => {
  const [budgets, transfers] = await Promise.all([
    getAutoBudgets({ type: { [Op.not]: 'business' } }),
    getAutoBudgets({ type: 'business' })
  ]);

  await Promise.all([
    ...budgets.map(async (b) => {
      try {
        await processRecurringAutoBudget(b);
      } catch (err) {
        logger.error(`Error processing AutoBudget ${b.id}`, err);
      }
    }),
    ...transfers.map(async (t) => {
      try {
        await processRecurringAutoTransfer(t);
      } catch (err) {
        logger.error(`Error processing AutoTransfer ${t.id}`, err);
      }
    })
  ]);

};

module.exports.setAutoBudget = async (autoBudgetData) => {
  const t = await sequelize.transaction();
  try {
    if (!autoBudgetData.user_id || !autoBudgetData.pocket_id || !autoBudgetData.recurring_amount || !autoBudgetData.schedule_type || !autoBudgetData.schedule_value) {
      throw new BadRequestError('Missing required fields');
    }

    if (!['weekly', 'monthly'].includes(autoBudgetData.schedule_type)) {
      throw new BadRequestError('Can only set to weekly or monthly');
    }

    // Check if auto budget is already exist for that user in that pocket, and still active
    const existAutoBudget = await AutoBudgeting.findOne({
      where: {
        user_id: autoBudgetData.user_id,
        pocket_id: autoBudgetData.pocket_id,
        status: 'active',
        is_active: true
      }
    });

    // If it exist, delete first
    if (existAutoBudget) {
      await existAutoBudget.destroy({ transaction: t });
    }

    // Create new one
    autoBudgetData.nextRunDate = calculateNextRunDate(autoBudgetData.schedule_type, autoBudgetData.schedule_value);

    const budget = await AutoBudgeting.create(autoBudgetData, { transaction: t });

    await t.commit();

    return budget;
  } catch (error) {
    await t.rollback();
    logger.error(error);
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

module.exports.getAutoBudget = async (autoBudgetData) => {
  const { user_id, pocket_id } = autoBudgetData;
  if (!user_id || !pocket_id) {
    throw new BadRequestError('user_id and pocket_id are required');
  }

  try {
    const existAutoBudget = await AutoBudgeting.findAll({
      where: {
        user_id,
        pocket_id,
        status: 'active',
        is_active: true
      },
      order: [
        ['updatedAt', 'DESC']
        ['createdAt', 'DESC']
      ],
      raw: true
    });

    return existAutoBudget;
  } catch (error) {
    logger.error(error);
    throw new InternalServerError(error.message);
  }
}

module.exports.deleteAutoBudget = async (autoBudgetData) => {
  const { user_id, pocket_id } = autoBudgetData;
  if (!user_id || !pocket_id) {
    throw new BadRequestError('user_id and pocket_id are required');
  }

  try {
    const existAutoBudget = await AutoBudgeting.findOne({
      where: {
        user_id,
        pocket_id,
        status: 'active',
        is_active: true
      },
      order: [
        ['updatedAt', 'DESC']
        ['createdAt', 'DESC']
      ]
    });

    await existAutoBudget.destroy();

    return existAutoBudget;
  } catch (error) {
    logger.error(error);
    throw new InternalServerError(error.message);
  }
}