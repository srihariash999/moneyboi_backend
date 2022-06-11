const { NotificationToken, validate } = require("../models/notification_token");
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

//* API to Create a record of notification token for a device.
router.post("/", auth, async (req, res) => {
  // #swagger.tags = ['NotificationTokens']
  // #swagger.summary = "Create a record of notification token for a device."
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const id = req.user._id;

  // See if there is a record with this user id.
  let notificationToken = await NotificationToken.findOne({ user: id });

  // If there is a record, update it.
  if (notificationToken) {
    notificationToken.token = req.body.token;
    try {
      await notificationToken.save();
      return res.send(notificationToken);
    } catch (e) {
      return res.status(400).send("Server error" + e);
    }
  }

  // no previous record, so create a new one and save it
  let _notif = new NotificationToken({
    user: id,
    token: req.body.token,
  });

  try {
    await _notif.save();
    return res.send(_notif);
  } catch (e) {
    return res.status(400).send("Server error" + e);
  }
});

module.exports = router;
