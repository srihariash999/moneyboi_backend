var admin = require("firebase-admin");

async function sendNotification(token, title, message) {
  console.log(" this is hit");
  admin
    .messaging()
    .sendToDevice(
      token,
      // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MWVmOTNiYWIwMDBkMjIzNTYzODVmYmEiLCJpYXQiOjE2NTQ5MzAwNzd9.F8WzEnWBKmaifj4LyTY4_4_z0TuZRauH-c0-qmgES8Q",
      {
        notification: {
          title: title,
          // " Some title ",
          body: message,
          // " some msg",
        },
      }
    )
    .then((res) => {
      console.log("Notification sent successfully");
      return res;
    })
    .catch((error) => {
      console.log(error);
      console.log("Notification sending failed");
    });
}

exports.sendNotification = sendNotification;
