const { Friend, validate } = require("../models/friend");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const auth = require("../middleware/auth");
const { User, validateUser } = require("../models/user");

router.get("/", auth, async (req, res) => {
  const friends = await Friend.find();
  res.send(friends);
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
  //   console.log(user1);
  //   console.log(" user 2", user2);

  // If user to send req to is not found, send error 404.
  if (user2.length === 0) {
    res.status(404).send("User with given email not found");
    return;
  }

  let duplicate = await Friend.find({
    user1: id,
    user2: user2[0]._id,
  });
  if (duplicate.length > 0) {
    res.status(400).send("Friend request already sent");
    return;
  }

  let unaccepted = await Friend.find({
    user1: user2[0]._id,
    user2: id,
  });

  if (unaccepted.length > 0) {
    res.status(400).send("A pending friend request exists from this user");
  } else {
    // create new friend request
    let friendReq = new Friend({
      user1: user1._id,
      user2: user2[0]._id,
      accepted: false,
      created_at: Date.now(),
    });

    try {
      await friendReq.save();
      res.send(friendReq);
      return;
    } catch (e) {
      res.status(400).send(`Server error $e`);
      return;
    }
  }
});

module.exports = router;
