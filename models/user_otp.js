const Joi = require("joi");
const mongoose = require("mongoose");

const userOtpSchema = new mongoose.Schema({
  user_email: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
  },

  user_otp: {
    type: String,
    minlength: 4,
    required: true,
  },

  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const UserOtp = mongoose.model("UserOtp", userOtpSchema);

function validateUserOtp(userOtp) {
  const schema = Joi.object({
    user_email: Joi.string().min(5).max(255).required().email(),
    user_otp: Joi.string().min(4).max(255).required(),
    created_at: Joi.date().required(),
  });

  return schema.validate(expense);
}

exports.UserOtp = UserOtp;
exports.validate = validateUserOtp;
