const logger = require('../../helpers/utils/logger');
const wrapper = require('../../helpers/utils/wrapper');
const authModules = require('../../modules/users/authModules');

module.exports.register = async (req, res) => {
  const inputData = {
    name: req.body.name,
    phone_number: req.body.phone_number,
    password: req.body.password,
    pin: req.body.pin,
  }

  authModules.registerUser(inputData)
    .then(resp => {
      logger.info('User has been registered in');
      wrapper.response(res, 'success', wrapper.data(resp), 'User has been registered in', 201);
    })
    .catch(err => {
      logger.error('Error while registering user', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while registering user. Error: ${err}`, 401);
    });
}

module.exports.login =  async (req, res) => {
  const loginData = {
    phone_number: req.body.phone_number,
    password: req.body.password
  }

  authModules.loginUser(loginData)
    .then(resp => {
      logger.info('User has logged in');
      wrapper.response(res, 'success', wrapper.data(resp), 'User has logged in', 201);
    })
    .catch(err => {
      logger.error('Error while user logged in', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while user logged in. Error: ${err}`, 401);
    });
}

module.exports.userProfile = async (req, res) => {
  const userData = req.userData;

  authModules.userProfile(userData)
    .then(resp => {
      logger.info('User data has been fetched');
      const result = {
        name: resp.name
      }
      wrapper.response(res, 'success', wrapper.data(result), 'User data has been fetched', 200);
    })
    .catch(err => {
      logger.error('Error while fetching user data', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching user data. Error: ${err}`, 401);
    });
}