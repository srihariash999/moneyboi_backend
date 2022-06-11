const express = require("express");
const app = express();
const swaggerUi = require("swagger-ui-express"),
  swaggerDocument = require("./swagger.json");
const mongoose = require("mongoose");
const expenses = require("./routes/expenses");
const users = require("./routes/users");
const auth = require("./routes/auth");
const friends = require("./routes/friends");
const repayments = require("./routes/repayments");
const notification_tokens = require("./routes/notification_tokens");
const admin = require("firebase-admin");
var serviceAccount = require("./moneyboi-c4c20-firebase-adminsdk-cq7kd-54256669b1.json");

const config = require("config");

if (!config.get("jwtPrivateKey")) {
  console.error("FATAL ERROR: jwtPrivateKey not defined");
  process.exit(1);
}

if (!config.get("database")) {
  console.error("FATAL ERROR: database not defined");
  process.exit(1);
}

if (!config.get("MJ_APIKEY_PUBLIC")) {
  console.error("FATAL ERROR: MJ_APIKEY_PUBLIC not defined");
  process.exit(1);
}

if (!config.get("MJ_APIKEY_PRIVATE")) {
  console.error("FATAL ERROR: MJ_APIKEY_PRIVATE not defined");
  process.exit(1);
}

mongoose
  .connect(config.get("database"))
  .then(() => console.log("Connected to mongodb"))
  .catch((err) => console.log("Could not connect to mongodb...", err));

//Startups
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://moneyboi-c4c20-default-rtdb.asia-southeast1.firebasedatabase.app",
});

console.log("Initialized Firebase SDK");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/expenses", expenses);
app.use("/api/friends", friends);
app.use("/api/repayments", repayments);
app.use("/api/repayments", repayments);
app.use("/api/notification_tokens", notification_tokens);

// app.post("/firebase/notification", (req, res) => {
//   admin
//     .messaging()
//     .sendToDevice(
//       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MWVmOTNiYWIwMDBkMjIzNTYzODVmYmEiLCJpYXQiOjE2NTQ5MzAwNzd9.F8WzEnWBKmaifj4LyTY4_4_z0TuZRauH-c0-qmgES8Q",
//       {
//         notification: {
//           title: " Some title ",
//           body: " some msg",
//         },
//       }
//     )
//     .then((response) => {
//       res.status(200).send("Notification sent successfully");
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// });

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));

module.exports.customAdmin = admin;
