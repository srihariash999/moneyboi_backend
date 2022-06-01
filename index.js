const express = require("express");
const app = express();

const mongoose = require("mongoose");
const expenses = require("./routes/expenses");
const users = require("./routes/users");
const auth = require("./routes/auth");
const friends = require("./routes/friends");
const repayments = require("./routes/repayments");

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

// mongoose.connect('mongodb://localhost/moneyboi')
//     .then(() => console.log('Connected to mongodb'))
//     .catch(err => console.log('Could not connect to mongodb...', err));

mongoose
  .connect(config.get("database"))
  .then(() => console.log("Connected to mongodb"))
  .catch((err) => console.log("Could not connect to mongodb...", err));

app.use(express.json());
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/expenses", expenses);
app.use("/api/friends", friends);
app.use("/api/repayments", repayments);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
