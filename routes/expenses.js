const {
  Expense,
  validate,
  validateExpenseUpdate,
} = require("../models/expense");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require("lodash");

//* Create Expense record api
router.post("/", auth, async (req, res) => {
  // #swagger.tags = ['Expenses']
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const id = req.user._id;
  let expense = new Expense({
    category: req.body.category,
    user: id,
    amount: req.body.amount,
    record_date: req.body.record_date,
    remarks: req.body.remarks,
  });

  try {
    await expense.save();

    res.send(expense);
  } catch (e) {
    res.status(400).send("Server error", e);
  }
});

router.get("/", auth, async (req, res) => {
  // #swagger.tags = ['Expenses']
  try {
    const id = req.user._id;
    // console.log(`id from token : ${id}`);
    if (req.query.date_in != null && req.query.date_out != null) {
      console.log(req.query);
      let dateIn = new Date(req.query.date_in).toISOString();
      let dateOut = new Date(req.query.date_out).toISOString();
      let expenses = await Expense.find({
        user: id,
        record_date: { $gte: dateIn, $lte: dateOut },
      });
      return res.send(expenses);
    }

    if (req.query.date_in != null && req.query.date_out == null) {
      let dateIn = new Date(req.query.date_in).toISOString();
      let expenses = await Expense.find({
        user: id,
        record_date: { $gte: dateIn },
      });
      return res.send(expenses);
    }
    if (req.query.date_in == null && req.query.date_out != null) {
      let dateOut = new Date(req.query.date_out).toISOString();
      let expenses = await Expense.find({
        user: id,
        record_date: { $lte: dateOut },
      });
      return res.send(expenses);
    } else {
      //Both Null

      let expenses = await Expense.find({ user: id });
      return res.send(expenses);
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("Server error");
  }
});

//$ API for updating an expense record.
router.put("/:id", auth, async (req, res) => {
  // #swagger.tags = ['Expenses']

  // validate the update request's body first.
  const { error } = validateExpenseUpdate(req.body);
  // if the body is not valid, return 400.
  if (error) return res.status(400).send(error.details[0].message);

  // if the body is valid, find the expense record to update.
  const id = req.params.id;

  //* if no id is provided in the req params send 400 bad req.
  if (!id) return res.status(400).send("No id provided");
  let expense = await Expense.findById(id);
  if (req.body.category != null) {
    expense.category = req.body.category;
  }
  if (req.body.user != null) {
    expense.user = req.body.user;
  }
  if (req.body.amount != null) {
    expense.amount = req.body.amount;
  }
  if (req.body.record_date != null) {
    expense.record_date = req.body.record_date;
  }
  if (req.body.remarks != null) {
    expense.remarks = req.body.remarks;
  }

  try {
    await expense.save();

    res.send(expense);
  } catch (e) {
    res.status(400).send("Server error", e);
  }
});

//$ API for delete an expense record.
router.delete("/:id", auth, async (req, res) => {
  // #swagger.tags = ['Expenses']
  try {
    const id = req.params.id;

    //* if no id is provided in the req params send 400 bad req.
    if (!id) return res.status(400).send("No expense record for given id");
    let expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      res.status(400).send("Error deleting the requested expense record");
    } else {
      res.send("Expense record deleted successfully");
    }
  } catch (e) {
    console.log(e);
    res.status(404).send("Cannot find expense record at the moment");
  }
});

module.exports = router;
