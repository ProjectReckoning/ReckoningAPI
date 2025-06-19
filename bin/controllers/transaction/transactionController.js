const logger = require('../../helpers/utils/logger');
const wrapper = require('../../helpers/utils/wrapper');
const topupModules = require('../../modules/transaction/topupModules');
const withdrawModules = require('../../modules/transaction/withdrawModules');

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