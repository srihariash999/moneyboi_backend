const Joi = require("joi");
const mongoose = require("mongoose");

const notificationTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 255,
  },

  user: {
    type: String,
    required: true,
    minlength: 4,
    required: true,
  },

  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const NotificationToken = mongoose.model(
  "NotificationToken",
  notificationTokenSchema
);

function validateNotiificationToken(notificationToken) {
  const schema = Joi.object({
    token: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(notificationToken);
}

exports.NotificationToken = NotificationToken;
exports.validate = validateNotiificationToken;
