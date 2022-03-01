const { User, validate } = require("../models/user");
const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const { UserOtp, validateUserOtp } = require("../models/user_otp");
const otpGenerator = require("otp-generator");

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

//$ API to create a new user.
router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");

  user = new User(_.pick(req.body, ["name", "email", "password"]));
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
  await user.save();

  res.send(_.pick(user, ["_id", "name", "email"]));
});

//$ API for forgot password OTP generate.
router.post("/forgotpassword/otp/generate", async (req, res) => {
  let userEmail = req.body.email;

  if (!userEmail) return res.status(400).send("Email is required.");
  else {
    let _user = await User.findOne({ email: userEmail });

    if (!_user) return res.status(400).send("User not found.");
    else {
      var otp = otpGenerator.generate(4, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
      });

      let _userOtp = await UserOtp.findOne({ user_email: _user.email });

      if (!_userOtp) {
        // No previous record of OTP. create new
        console.log(" no existing record, creating one");
        _userOtp = new UserOtp({
          user_email: _user.email,
          user_otp: otp,
          created_at: new Date(),
        });
        _userOtp.save();
      } else {
        // Update the existing OTP record.
        console.log(" updating existing record");

        _userOtp.user_otp = otp;
        _userOtp.created_at = new Date();
        await _userOtp.save();
      }

      const mailjet = require("node-mailjet").connect(
        process.env.MJ_APIKEY_PUBLIC,
        process.env.MJ_APIKEY_PRIVATE
      );
      const request = mailjet.post("send", { version: "v3.1" }).request({
        Messages: [
          {
            From: {
              Email: "zepplaud@gmail.com",
              Name: "Moneyboi Team - Zepplaud",
            },
            To: [
              {
                Email: _user.email,
                Name: _user.name,
              },
            ],
            Subject: "OTP for resetting your password",
            TextPart: "",
            HTMLPart: `<h3>Hi ${_user.name} ,</h3><br><p>Your OTP for resetting your password is ${otp}</p><br><p>Regards,</p><p>Moneyboi Team</p>`,
          },
        ],
      });
      request
        .then((result) => {
          console.log(result.body);
        })
        .catch((err) => {
          console.log(err.statusCode);
        });

      res.send("OTP sent to your email.");
    }
  }
});

//$ API for forgot password OTP verify.
router.post("/forgotpassword/otp/verify", async (req, res) => {
  let otp = req.body.otp;
  let userEmail = req.body.email;
  let newPassword = req.body.new_password;

  if (!userEmail) return res.status(400).send("Email is required.");
  else if (!otp) return res.status(400).send("OTP is required.");
  else if (!newPassword)
    return res.status(400).send("New password is required.");
  else {
    let _userOtp = await UserOtp.findOne({ user_email: userEmail });

    if (!_userOtp) {
      return res.status(400).send("Invalid email or OTP");
    } else {
      if (_userOtp.user_otp == otp) {
        console.log(" otp matched");
        _userOtp.created_at = new Date();
        await _userOtp.save();

        let user = await User.findOne({ email: userEmail });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.send("OTP verified & Password Updated");
      } else {
        return res.status(400).send("Invalid OTP");
      }
    }
  }
});

module.exports = router;
