const { Friend, validate } = require("../models/friend");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { User } = require("../models/user");

router.get("/", auth, async (req, res) => {
  const id = req.user._id;
  // Query : either user1 is the logged in user or user2 is the logged in user
  //         and the request status is accepted.
  const friends = await Friend.find()
    .or([{ user1: id }, { user2: id }])
    .and({ accepted: true });

  let friendList = [];

  for (var i of friends) {
    let friendId = i.user1 == id ? i.user2 : i.user1;
    let user = await User.findById(friendId);
    friendList.push({
      name: user.name,
      email: user.email,
      id: i._id,
    });
  }

  res.send(friendList);
});

router.get("/pending_action", auth, async (req, res) => {
  const id = req.user._id;
  const requested = await Friend.find({ user1: id }).and({ accepted: false });
  let requestedList = [];

  for (var i of requested) {
    let user = await User.findById(i.user2);
    requestedList.push({
      name: user.name,
      email: user.email,
      id: i._id,
    });
  }

  const pending = await Friend.find({ user2: id }).and({ accepted: false });
  let pendingList = [];

  for (var i of pending) {
    let user = await User.findById(i.user1);
    pendingList.push({
      name: user.name,
      email: user.email,
      id: i._id,
    });
  }
  res.send({
    pending: pendingList,
    requested: requestedList,
  });
});

//* Create Friend Request Api
router.post("/", auth, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const id = req.user._id;
  const email = req.body.email;
  const user1 = await User.findById(req.user._id).select("-password");
  if (user1.email == email) {
    return res.status(400).send("You cannot send friend request to yourself");
  }
  const user2 = await User.find({ email: email }).select("-password");

  // If user to send req to is not found, send error 404.
  if (user2.length === 0) {
    return res.status(404).send("User with given email not found");
  }

  // Checking if the request of the kind already exists.
  let duplicate = await Friend.find({
    user1: id,
    user2: user2[0]._id,
  });
  if (duplicate.length > 0) {
    if (duplicate[0].accepted === true) {
      return res.status(400).send("User being requested is already a friend");
    } else {
      return res.status(400).send("Friend request already sent");
    }
  }

  // Checking if the user to send req to has already sent a req.
  let unaccepted = await Friend.find({
    user1: user2[0]._id,
    user2: id,
  });

  if (unaccepted.length > 0) {
    if (unaccepted[0].accepted) {
      return res.status(400).send("User being requested is already a friend");
    }
    return res
      .status(400)
      .send("A pending friend request exists from this user");
  }

  // create new friend request
  let friendReq = new Friend({
    user1: user1._id,
    user2: user2[0]._id,
    accepted: false,
    created_at: Date.now(),
  });

  try {
    let friend = await friendReq.save();
    let user2 = await User.findById(friend.user2);
    // console.log(res);
    let map = {
      name: user2.name,
      email: user2.email,
      id: friend._id,
    };
    res.send(map);
    return;
  } catch (e) {
    res.status(400).send(`Server error ${e}`);
    return;
  }
});

//* Accept Friend Request Api
router.post("/accept_request", auth, async (req, res) => {
  const fId = req.body.id;
  if (fId === null || fId === undefined) {
    return res.status(400).send("Friend request id is required");
  }
  let fReq;
  try {
    fReq = await Friend.findById(fId);
  } catch (e) {
    return res.status(400).send("Given Id is invalid");
  }

  if (!fReq) {
    return res.status(400).send("Friend request with given Id not found.");
  }

  // Update the 'accepted' field of found friend request
  fReq.accepted = true;
  try {
    await fReq.save();
    res.send(fReq);
    return;
  } catch (e) {
    res.status(400).send(`Server error $e`);
    return;
  }
});

//* Delete Friend Request Api
router.delete("/delete_request/:id", auth, async (req, res) => {
  const fId = req.params.id;
  if (fId === null || fId === undefined) {
    return res.status(400).send("Friend request id is required");
  }
  let fReq;
  try {
    fReq = await Friend.findById(fId);
  } catch (e) {
    return res.status(400).send("Given Id is invalid");
  }

  if (!fReq) {
    return res.status(400).send("Friend request with given Id not found.");
  }

  // Delete the found friend request

  try {
    await fReq.delete();
    res.status(204).send();
    return;
  } catch (e) {
    res.status(400).send(`Server error $e`);
    return;
  }
});

module.exports = router;
