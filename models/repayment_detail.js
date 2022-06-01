const Joi = require("joi");
const mongoose = require("mongoose");
// const jwt = require("jsonwebtoken");
// const config = require("config");

const repayDetailSchema = new mongoose.Schema({
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
  user1_balance: {
    type: Number,
    required: true,
  },
  user2_balance: {
    type: Number,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const RepaymentDetails = mongoose.model("RepaymentDetails", repayDetailSchema);

function validateRepaymentDetails(repayDetails) {
  const schema = Joi.object({
    friend: Joi.string().min(3).max(50).required(),
  });

  return schema.validate(repayDetails);
}

exports.RepaymentDetails = RepaymentDetails;
exports.validateRepaymentDetails = validateRepaymentDetails;
