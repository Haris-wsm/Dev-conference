const router = require("express").Router();

// Controller
const AuthControllers = require("./controllers");

// Middlewares
const AuthMiddleware = require("../../middleware/AuthMiddleware");

router.post("/loginoneid", AuthControllers.loginOneId);
router.post("/loginCollabMail", AuthControllers.loginCollabMail);
router.post("/collab", AuthControllers.collab);
router.post("/logout", AuthMiddleware.verifyToken, AuthControllers.logout);
router.post("/refreshToken", AuthControllers.refreshToken);
router.post("/refreshTokenCollab", AuthControllers.refreshTokenCollab);
router.post(
  "/registerOTP",
  AuthMiddleware.verifyToken,
  AuthControllers.registerOTP
);
router.post(
  "/checkTokenExpire",
  AuthMiddleware.verifyToken,
  AuthControllers.checkTokenExpire
);
router.post("/sharedtoken", AuthControllers.sharedToken);
router.post("/sharedtokenDGA", AuthControllers.sharedtokenDGA);

module.exports = router;
