const bcrypt = require("bcrypt");
const passwordValidator = require("password-validator");

const passwordSchema = new passwordValidator();
passwordSchema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(1)
  .has()
  .symbols(1)
  .has()
  .not()
  .spaces();

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const validatePassword = (password) => {
  return passwordSchema.validate(password);
};

module.exports = { hashPassword, validatePassword, passwordSchema };