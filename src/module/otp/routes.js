const router = require("express").Router();

const OtpController = require("./controller");

const AuthMiddleware = require("../../middleware/AuthMiddleware");

router.post("/sendotp", AuthMiddleware.verifyToken, OtpController.sendOTP);
router.post(
  "/checkotp/:OTP",
  AuthMiddleware.verifyToken,
  OtpController.checkOTP
);
router.post("/test", AuthMiddleware.verifyToken, OtpController.testOTP);

module.exports = router;
