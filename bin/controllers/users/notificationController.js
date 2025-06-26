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

module.exports.getAllNotif = async (req, res) => {
  const notifData = {
    userId: req.userData.id
  };

  notificationModule.getAllNotif(notifData)
    .then(resp => {
      logger.info('Succes to fetch all notif data');
      wrapper.response(res, 'success', wrapper.data(resp), 'Succes to fetch all notif data', 200);
    })
    .catch(err => {
      logger.error('Error while fetching all notif data', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching all notif data. Error: ${err}`, 400);
    });
}

module.exports.getDetailNotif = async (req, res) => {
  const notifData = {
    userId: req.userData.id,
    notifId: req.params.notifId
  };

  notificationModule.getDetailNotif(notifData)
    .then(resp => {
      logger.info('Succes to fetch detail notif data');
      wrapper.response(res, 'success', wrapper.data(resp), 'Succes to fetch detail notif data', 200);
    })
    .catch(err => {
      logger.error('Error while fetching detail notif data', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching detail notif data. Error: ${err}`, 400);
    });
}