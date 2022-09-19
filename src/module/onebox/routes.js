const router = require("express").Router();

// Controllers
const OneboxController = require("../onebox/controller");

// Middlewares
const AuthMiddleware = require("../../middleware/AuthMiddleware");

router.get(
  "/download/:file_id",
  AuthMiddleware.verifyToken,
  OneboxController.download
);
router.get(
  "/saveonebox/:meetingid",
  AuthMiddleware.verifyToken,
  OneboxController.saveOnebox
);
router.post(
  "/getoneboxbusiness",
  AuthMiddleware.verifyToken,
  OneboxController.getOneboxBusiness
);
router.get(
  "/getoneboxfile/:meetingid",
  AuthMiddleware.verifyToken,
  OneboxController.getOneboxFile
);
module.exports = router;
