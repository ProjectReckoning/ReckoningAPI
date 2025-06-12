const Joi = require('joi');
const wrapper = require('../../helpers/utils/wrapper');

const loginSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^62[0-9]{8,13}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must start with 62 and contain 10-15 digits in total.',
    }),
  password: Joi.string().min(8).required(),
});

const validateLoginInput = (req, res, next) => {
  let phone = req.body.phone_number;
  if (typeof phone === 'string') {
    phone = phone.trim();
    if (phone.startsWith('+62')) {
      phone = phone.replace(/^\+/, '');
    } else if (phone.startsWith('08')) {
      phone = '62' + phone.slice(1); // Replace only the leading 0
    }
    req.body.phone_number = phone;
  }

  const { error } = loginSchema.validate(req.body);
  if (error) {
    return wrapper.response(res, 'fail', wrapper.error(error), `Validation error, check your input: ${error.message}`, 400);
  }
  next();
}

module.exports = validateLoginInput;