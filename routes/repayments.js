const {
  RepaymentDetails,
  validateRepaymentDetails,
} = require("../models/repayment_detail");

const {
  RepaymentTransaction,
  validateRepaymentTransaction,
} = require("../models/repayment_transaction");

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { User } = require("../models/user");

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

// router.get("/pending_action", auth, async (req, res) => {
//   const id = req.user._id;
//   const requested = await Friend.find({ user1: id }).and({ accepted: false });
//   let requestedList = [];

//   for (var i of requested) {
//     let user = await User.findById(i.user2);
//     requestedList.push({
//       name: user.name,
//       email: user.email,
//       id: i._id,
//     });
//   }

//   const pending = await Friend.find({ user2: id }).and({ accepted: false });
//   let pendingList = [];

//   for (var i of pending) {
//     let user = await User.findById(i.user1);
//     pendingList.push({
//       name: user.name,
//       email: user.email,
//       id: i._id,
//     });
//   }
//   res.send({
//     pending: pendingList,
//     requested: requestedList,
//   });
// });

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

  let bal1 = req.body.amount;
  let bal2 = req.body.amount * -1;

  //   create new repayment transaction.
  let transaction = new RepaymentTransaction({
    user1: repayAcc.user1,
    user2: repayAcc.user2,
    repayment_account: repayId,
    user1_transaction: id === repayAcc.user1 ? bal1 : bal2,
    user2_transaction: id === repayAcc.user2 ? bal1 : bal2,
    user1_accepted: id === repayAcc.user1 ? true : false,
    user2_accepted: id === repayAcc.user2 ? true : false,
    created_at: Date.now(),
  });

  try {
    let newTransaction = await transaction.save();
    repayAcc.user1_balance += newTransaction.user1_transaction;
    repayAcc.user2_balance += newTransaction.user2_transaction;
    await repayAcc.save();
    res.send(newTransaction);
    return;
  } catch (e) {
    res.status(400).send(`Server error ${e}`);
    return;
  }
});

// //* Accept Friend Request Api
// router.post("/accept_request", auth, async (req, res) => {
//   const fId = req.body.id;
//   if (fId === null || fId === undefined) {
//     return res.status(400).send("Friend request id is required");
//   }
//   let fReq;
//   try {
//     fReq = await Friend.findById(fId);
//   } catch (e) {
//     return res.status(400).send("Given Id is invalid");
//   }

//   if (!fReq) {
//     return res.status(400).send("Friend request with given Id not found.");
//   }

//   // Update the 'accepted' field of found friend request
//   fReq.accepted = true;
//   try {
//     await fReq.save();
//     res.send(fReq);
//     return;
//   } catch (e) {
//     res.status(400).send(`Server error $e`);
//     return;
//   }
// });

// //* Delete Friend Request Api
// router.delete("/delete_request/:id", auth, async (req, res) => {
//   const fId = req.params.id;
//   if (fId === null || fId === undefined) {
//     return res.status(400).send("Friend request id is required");
//   }
//   let fReq;
//   try {
//     fReq = await Friend.findById(fId);
//   } catch (e) {
//     return res.status(400).send("Given Id is invalid");
//   }

//   if (!fReq) {
//     return res.status(400).send("Friend request with given Id not found.");
//   }

//   // Delete the found friend request

//   try {
//     await fReq.delete();
//     res.status(204).send();
//     return;
//   } catch (e) {
//     res.status(400).send(`Server error $e`);
//     return;
//   }
// });

module.exports = router;
