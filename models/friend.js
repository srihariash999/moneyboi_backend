const Joi = require("joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");

const friendSchema = new mongoose.Schema({
  user1: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  user2: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  accepted: {
    type: Boolean,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const Friend = mongoose.model("Friend", friendSchema);

function validateFriend(friend) {
  const schema = Joi.object({
    email: Joi.string().min(3).max(50).required().email(),
  });

  return schema.validate(friend);
}

exports.Friend = Friend;
exports.validate = validateFriend;
