const logger = require('../../helpers/utils/logger');
const wrapper = require('../../helpers/utils/wrapper');
const topupModules = require('../../modules/transaction/topupModules');
const withdrawModules = require('../../modules/transaction/withdrawModules');
const autoBudgetModules = require('../../modules/transaction/autoBudgetModules');

module.exports.initTopUp = async (req, res) => {
  const userData = req.userData;
  const topupData = {
    balance: parseFloat(req.body.balance),
    pocket_id: req.body.pocket_id,
  }

  topupModules.initTopUp(userData.id, topupData)
    .then(resp => {
      logger.info('Topup to pocket success');
      wrapper.response(res, 'success', wrapper.data(resp), 'Topup to pocket success', 200);
    })
    .catch(err => {
      logger.error('Error while topup to pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while topup to pocket. Error: ${err}`, 400);
    });
}

module.exports.initWithdraw = async (req, res) => {
  const userData = req.userData;
  const withdrawData = {
    balance: parseFloat(req.body.balance),
    pocket_id: req.body.pocket_id,
  }

  withdrawModules.initWithdraw(userData.id, withdrawData)
    .then(resp => {
      logger.info('Withdraw from pocket success');
      wrapper.response(res, 'success', wrapper.data(resp), 'Withdraw from pocket success', 200);
    })
    .catch(err => {
      logger.error('Error while withdraw from pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while withdraw from pocket. Error: ${err}`, 400);
    });
}

module.exports.setAutoBudget = async (req, res) => {
  const autoBudgetData = {
    user_id: req.userData.id,
    pocket_id: req.params.pocketId,
    recurring_amount: parseFloat(req.body.recurring_amount),
    treshold_amount: 0,
    status: req.body.status || 'active',
    is_active: true,
    schedule_type: req.body.schedule_type,
    schedule_value: req.body.schedule_value,
  }

  autoBudgetModules.setAutoBudget(autoBudgetData)
    .then(resp => {
      logger.info('Success set auto budget');
      wrapper.response(res, 'success', wrapper.data(resp), 'Success set auto budget', 200);
    })
    .catch(err => {
      logger.error('Error while set the auto budget', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while set the auto budget. Error: ${err}`, 400);
    });
}