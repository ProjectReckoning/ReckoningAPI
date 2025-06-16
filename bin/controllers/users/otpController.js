const otpModule = require('../../modules/users/otpModules');
const logger = require('../../helpers/utils/logger');
const wrapper = require('../../helpers/utils/wrapper');

module.exports.requestOtp = async (req, res) => {
  const reqOtpData = {
    phone_number: req.body.phone_number,
    password: req.body.password
  };

  otpModule.requestOtp(reqOtpData)
    .then(resp => {
      logger.info('OTP has been sent');
      wrapper.response(res, 'success', wrapper.data(resp), 'OTP has been sent', 201);
    })
    .catch(err => {
      logger.error('Error while sending the otp', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while sending the otp. Error: ${err}`, 401);
    });
}

module.exports.verifyOtp = async (req, res) => {
  const verifyOtpData = {
    phone_number: req.body.phone_number,
    sessionId: req.body.sessionId,
    otp: req.body.otp,
  }

  otpModule.verifyOtp(verifyOtpData)
    .then(resp => {
      logger.info('OTP has been verified');
      wrapper.response(res, 'success', wrapper.data(resp), 'OTP has been verified', 201);
    })
    .catch(err => {
      logger.error('Error while verifying the otp', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while verifying the otp. Error: ${err}`, 401);
    });
}