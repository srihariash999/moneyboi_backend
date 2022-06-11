const { NotificationToken } = require("../models/notification_token");

/// Middleware function that adds a notification token to the request if present.
function notification(req, res, next) {
  const user = req.user;
  if (!req) {
    console.log(
      " possible usage of retrieving notif token on an un-authenticated endpoint"
    );
    return res.status(401).send("Access denied. No token provided.");
  }
  try {

    // find the token by user id.

    const _notifToken = await NotificationToken.findOne({ user: user._id });


    // if found, add it to request.
    if (_notifToken) {
        req.notification = _notifToken;
    }

    next();
  } catch (ex) {
    console.log(ex);
    return res.status(400).send("Invalid token!");
  }
}

module.exports = notification;
