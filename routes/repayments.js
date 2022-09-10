const {
  RepaymentDetails,
  validateRepaymentDetails,
} = require("../models/repayment_detail");

const {
  RepaymentTransaction,
  validateRepaymentTransaction,
} = require("../models/repayment_transaction");

const { NotificationToken } = require("../models/notification_token");

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { User } = require("../models/user");
// const { route } = require("./expenses");
const { sendNotification } = require("../utilities/firebase");

//* Get all of user's repayments API.
router.get("/", auth, async (req, res) => {
  // #swagger.tags = ['Repayments']
  const id = req.user._id;
  // Query : either user1 is the logged in user or user2 is the logged in user
  const repayments = await RepaymentDetails.find().or([
    { user1: id },
    { user2: id },
  ]);

  let repaymentsList = [];

  for (var i of repayments) {
    let friendId = i.user1 == id ? i.user2 : i.user1;
    let user = await User.findById(friendId);

    repaymentsList.push({
      id: i._id,
      friend: user,
      balance: i.user1 == id ? i.user1_balance : i.user2_balance,
      created_at: i.created_at,
    });
  }

  res.send(repaymentsList);
});

//* Create New Repayment Account Api
router.post("/", auth, async (req, res) => {
  // #swagger.tags = ['Repayments']
  const { error } = validateRepaymentDetails(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const id = req.user._id;
  const user1 = await User.findById(req.user._id).select("-password");
  //   console.log(" frien email : ", req.body.friend);
  const user2 = await User.findOne({ email: req.body.friend }).select(
    "-password"
  );
  //   console.log(" user 2 : ", user2);
  // If user to send req to is not found, send error 404.
  if (!user2) {
    return res.status(404).send("User with given email not found");
  }

  // Checking if the request of the kind already exists.
  let duplicate = await RepaymentDetails.find().or([
    { user1: id, user2: user2._id },
    { user2: id, user1: user2._id },
  ]);
  if (duplicate.length > 0) {
    return res
      .status(400)
      .send("Repayment account with this friend already exists!");
  }

  // create new repayment account.
  let repayAcc = new RepaymentDetails({
    user1: user1._id,
    user2: user2._id,
    user1_balance: 0,
    user2_balance: 0,
    created_at: Date.now(),
  });

  try {
    let newRepayAcc = await repayAcc.save();

    // Get the notif token of user2.
    let notificationToken = await NotificationToken.findOne({
      user: user2._id,
    });
    if (notificationToken) {
      console.log(" notif token not null : ", notificationToken);
      // Send notification to user2.
      sendNotification(
        notificationToken.token,
        "New Repay Account !",
        `${user1.name} has created a new Repay account with you!`
      )
        .then((res) => {
          console.log(" notification sent : ", res);
        })
        .catch((err) => {
          console.log(" notification error : ", err);
        });
    }

    let map = {
      friend: user2,
      user1_balance: newRepayAcc.user1_balance,
      user2_balance: newRepayAcc.user2_balance,
      created_at: newRepayAcc.created_at,
      id: newRepayAcc._id,
    };
    res.send(map);
    return;
  } catch (e) {
    res.status(400).send(`Server error ${e}`);
    return;
  }
});

//* Get all of user's repayment transactions by ID.
router.get("/transactions", auth, async (req, res) => {
  // #swagger.tags = ['Repayments']
  const id = req.user._id;

  const repayId = req.query.id;

  let repayAcc = await RepaymentDetails.findById(repayId);

  if (!repayAcc) {
    return res.status(404).send("Repayment account not found");
  }

  const transactions = await RepaymentTransaction.find({
    repayment_account: repayId,
  });
  res.send(transactions);
});

//* Create New Repayment Transaction Api
router.post("/transaction", auth, async (req, res) => {
  // #swagger.tags = ['Repayments']
  const { error } = validateRepaymentTransaction(req.body);

  if (error) return res.status(400).send(error.details[0].message);

  const repayId = req.body.id;

  const repayAcc = await RepaymentDetails.findById(repayId);

  if (!repayAcc) {
    return res.status(400).send("Repayment Account not found");
  }

  if (req.body.amount === 0) {
    return res.status(400).send("Amount cannot be zero");
  }

  const id = req.user._id;

  let note = req.body.note;
  let bal1 = req.body.amount;
  let bal2 = req.body.amount * -1;
  let transaction;
  //   create new repayment transaction.
  if (req.body.amount < 0) {
    transaction = new RepaymentTransaction({
      user1: repayAcc.user1,
      user2: repayAcc.user2,
      repayment_account: repayId,
      user1_transaction: id === repayAcc.user1 ? bal1 : bal2,
      user2_transaction: id === repayAcc.user2 ? bal1 : bal2,
      user1_accepted: true,
      user2_accepted: true,
      note: note,
      created_at: Date.now(),
    });
  } else {
    transaction = new RepaymentTransaction({
      user1: repayAcc.user1,
      user2: repayAcc.user2,
      repayment_account: repayId,
      user1_transaction: id === repayAcc.user1 ? bal1 : bal2,
      user2_transaction: id === repayAcc.user2 ? bal1 : bal2,
      user1_accepted: id === repayAcc.user1 ? true : false,
      user2_accepted: id === repayAcc.user2 ? true : false,
      note: note,
      created_at: Date.now(),
    });
  }

  try {
    let newTransaction = await transaction.save();

    if (req.body.amount < 0) {
      const repayAcc = await RepaymentDetails.findById(repayId);
      repayAcc.user1_balance += transaction.user1_transaction;
      repayAcc.user2_balance += transaction.user2_transaction;
      await repayAcc.save();
    }

    // Get the notif token of other user.
    let otherUser = id === repayAcc.user1 ? repayAcc.user2 : repayAcc.user1;
    let thisUser = id === repayAcc.user1 ? repayAcc.user1 : repayAcc.user2;

    let notificationToken = await NotificationToken.findOne({
      user: otherUser.id,
    });
    if (notificationToken) {
      let val = body.amount < 0;
      console.log(" notif token not null : ", notificationToken);
      // Send notification to user2.
      sendNotification(
        notificationToken.token,
        "New Transaction",
        `${thisUser.name} has ${val ? "taken" : "given"} ${
          val ? "from" : "to"
        } you.`
      )
        .then((res) => {
          console.log(" notification sent : ", res);
        })
        .catch((err) => {
          console.log(" notification error : ", err);
        });
    }

    res.send(newTransaction);
    return;
  } catch (e) {
    res.status(400).send(`Server error ${e}`);
    return;
  }
});

//* Consent a Repayment Transaction - API
router.post("/transaction/consent", auth, async (req, res) => {
  // #swagger.tags = ['Repayments']

  // #swagger.summary = 'Endpoint to be used to add consent to a repayment transaction'

  const transactionId = req.body.id;
  if (!transactionId) return res.status(400).send("Transaction ID is required");

  const transaction = await RepaymentTransaction.findById(transactionId);

  if (!transaction) {
    return res.status(400).send("Transaction with given ID not found");
  }

  const id = req.user._id;

  // check if the user is the sender or receiver of the transaction.
  // if not then the user should not modify anything in this transaction.
  if (id !== transaction.user1 && id !== transaction.user2) {
    return res
      .status(403)
      .send("You are not authorized to modify this transaction.");
  }

  let isUser1 = true;
  if (id === transaction.user2) {
    isUser1 = false;
  }

  // check if the user has already consented to this transaction.
  if (isUser1 && transaction.user1_accepted) {
    return res
      .status(400)
      .send("You have already consented to this transaction.");
  }

  if (!isUser1 && transaction.user2_accepted) {
    return res
      .status(400)
      .send("You have already consented to this transaction.");
  }

  //   Update the consent.

  if (isUser1) {
    transaction.user1_accepted = true;
  } else {
    transaction.user2_accepted = true;
  }

  try {
    await transaction.save();
    const repayAcc = await RepaymentDetails.findById(
      transaction.repayment_account
    );
    repayAcc.user1_balance += transaction.user1_transaction;
    repayAcc.user2_balance += transaction.user2_transaction;
    await repayAcc.save();

    // Get the notif token of other user.
    let otherUser = isUser1 ? repayAcc.user2 : repayAcc.user1;
    let thisUser = isUser1 ? repayAcc.user1 : repayAcc.user2;

    let notificationToken = await NotificationToken.findOne({
      user: otherUser.id,
    });
    if (notificationToken) {
      console.log(" notif token not null : ", notificationToken);
      // Send notification to user2.
      sendNotification(
        notificationToken.token,
        "New Transaction",
        `${thisUser.name} has consented to a transaction of value ₹${Math.abs(
          transaction.user1_transaction
        )}`
      )
        .then((res) => {
          console.log(" notification sent : ", res);
        })
        .catch((err) => {
          console.log(" notification error : ", err);
        });
    }

    res.send(transaction);
    return;
  } catch (e) {
    res.status(400).send(`Server error ${e}`);
    return;
  }
});

module.exports = router;
