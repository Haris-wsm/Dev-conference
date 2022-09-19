const router = require("express").Router();

// * User controller
const UserController = require("../user/controllers");

// Middlewares
const AuthMiddleware = require("../../middleware/AuthMiddleware");

router.post("/registeroneid", UserController.registerOneId); // **
router.post("/decodeData", UserController.decodeData);
router.post("/decodeDataJs", UserController.decodeDataJs);
router.post("/encodeData", UserController.encodeData);
router.post(
  "/changepassword",
  AuthMiddleware.verifyToken,
  UserController.changePassword
);

router.post(
  "/checkroleuser",
  AuthMiddleware.verifyToken,
  UserController.checkUserRole
);

router.post(
  "/showLOAlevel",
  AuthMiddleware.verifyToken,
  UserController.showLOAlevel
);

router.post(
  "/joincheckLOAlevel",
  AuthMiddleware.verifyToken,
  UserController.joinByLevelLOA
);

router.post(
  "/sendOtpUpgradeLoa",
  AuthMiddleware.verifyToken,
  UserController.upgreadeLOA
);

router.post(
  "/checkOtpUpgradeLoa",
  AuthMiddleware.verifyToken,
  UserController.checkOtpUpgradeLOA
);

router.post(
  "/checkOtpUpgradeLoa",
  AuthMiddleware.verifyToken,
  UserController.delete
);

router.post("/business", UserController.getBusiness);
router.post("/checkOnebox", UserController.checkOneBox);

module.exports = router;
