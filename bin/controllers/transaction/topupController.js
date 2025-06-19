const logger = require('../../helpers/utils/logger');
const wrapper = require('../../helpers/utils/wrapper');
const topupModules = require('../../modules/transaction/topupModules');

module.exports.initTopUp = async (req, res) => {
  const userData = req.userData;
  const topupData = {
    balance: parseFloat(req.body.balance),
    pocket_id: req.body.pocket_id,
  }

  topupModules.initTopUp(userData.id, topupData)
    .then(resp => {
      logger.info('Topup to pocket success');
      wrapper.response(res, 'success', wrapper.data(resp), 'Topup to pocket success', 201);
    })
    .catch(err => {
      logger.error('Error while topup to pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while topup to pocket. Error: ${err}`, 400);
    });
}