const categoriesList = require("../utilities/categories_list");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.js");

//* Get all Categories API.
router.get("/", async (req, res) => {
  // #swagger.tags = ['Categories']
  res.send(categoriesList);
});

//* API to Create a category
// router.post("/", auth, async (req, res) => {
//   // #swagger.tags = ['Categories']
//   // #swagger.summary = "Create a category with given name & url."
//   const { error } = validate(req.body);
//   if (error) return res.status(400).send(error.details[0].message);
//
//   // See if there is a category with this name.
//   let category = await Category.findOne({ name: req.body.name });
//
//   // If there is a record, update it.
//   if (category) {
//       return res.status(400).send("A category with this name already exists.");
//   }
//
//   // no previous category, so create a new one
//   let _category = new Category({
//     name: req.body.name,
//     url: req.body.url,
//   });
//
//   try {
//     await _category.save();
//     return res.send(_category);
//   } catch (e) {
//     return res.status(400).send("Server error" + e);
//   }
// });

module.exports = router;
