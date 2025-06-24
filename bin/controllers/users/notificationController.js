const notificationModule = require('../../modules/users/notificationModules');
const logger = require('../../helpers/utils/logger');
const wrapper = require('../../helpers/utils/wrapper');

module.exports.registerPushToken = async (req, res) => {
  const notifData = {
    userId: req.userData.id,
    expoPushToken: req.body.expoPushToken
  };

  notificationModule.registerPushToken(notifData)
    .then(({ result, message }) => {
      logger.info(message);
      wrapper.response(res, 'success', wrapper.data(result), message, 201);
    })
    .catch(err => {
      logger.error('Error while registering the push token', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while registering the push token. Error: ${err}`, 401);
    });
}