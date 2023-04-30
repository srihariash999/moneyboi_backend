const mongoose = require("mongoose");
const Joi = require('joi');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

const Category = mongoose.model("Category", categorySchema);

function validateCategory(category) {
  const schema = Joi.object({
    name: Joi.string().min(1),
    url: Joi.string().min(1),
  });

  return schema.validate(category);
}

exports.validate = validateCategory;
exports.Category = Category;
