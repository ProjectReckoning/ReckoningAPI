const logger = require('../../helpers/utils/logger');
const userModules = require('../../modules/users/userModules');
const wrapper = require('../../helpers/utils/wrapper');

module.exports.addBalance = async (req, res) => {
  const userData = req.userData;
  const balance = req.body.balance;

  userModules.addBalance(userData.id, balance)
    .then(resp => {
      logger.info('User has updated their balance');
      wrapper.response(res, 'success', wrapper.data(resp), 'User has updated their balance', 201);
    })
    .catch(err => {
      logger.error('Error while updating user balance', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while updating user balance. Error: ${err}`, 401);
    });
}