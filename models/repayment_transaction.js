const Joi = require("joi");
const mongoose = require("mongoose");
// const jwt = require("jsonwebtoken");
// const config = require("config");

const repayTransactionSchema = new mongoose.Schema({
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
  repayment_account: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
  },
  user1_transaction: {
    type: Number,
    required: true,
  },
  user2_transaction: {
    type: Number,
    required: true,
  },
  user1_accepted: {
    type: Boolean,
    required: true,
  },
  user2_accepted: {
    type: Boolean,
    required: true,
  },
  created_at: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const RepaymentTransaction = mongoose.model(
  "RepaymentTransaction",
  repayTransactionSchema
);

function validateRepaymentTransaction(repayTransaction) {
  const schema = Joi.object({
    id: Joi.string().min(3).max(50).required(),
    amount: Joi.number().required(),
  });

  return schema.validate(repayTransaction);
}

exports.RepaymentTransaction = RepaymentTransaction;
exports.validateRepaymentTransaction = validateRepaymentTransaction;
