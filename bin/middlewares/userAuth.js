const jwt = require('jsonwebtoken');
const config = require('../config');
const wrapper = require('../helpers/utils/wrapper');
const { UnauthorizedError } = require('../helpers/error');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    req.userData = jwt.verify(token, config.get('/authentication'));
    req.userData.token = token;
    next();
  } catch (error) {
    let response = {
      data: {}
    };
    response.message = 'Auth failed';
    response.status = 401,
      response.ok = false;

    return wrapper.response(res, 'fail', wrapper.error(new UnauthorizedError('Auth failed')));
  }
}

const permit = (...allow) => {
  const isAllowed = (status) => allow.indexOf(status) > -1;

  return (req, res, next) => {
    if (isAllowed(req.user.role)) {
      next();
    } else {
      return res.rest.unauthorized("Role tidak sesuai");
    }
  };
};