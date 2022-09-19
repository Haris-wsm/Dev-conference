const router = require("express").Router();

// Controller
const RoomController = require("./controller");

// Middlewares
const AuthMiddleware = require("../../middleware/AuthMiddleware");

router.post(
  "/pexip",
  AuthMiddleware.verifyToken,
  RoomController.createPexipRoom
);

router.post(
  "/pexip/logout",
  AuthMiddleware.verifyToken,
  RoomController.logoutPexip
);

router.post("/createsession", AuthMiddleware.verifyToken);
// router.get("/check/:uid", AuthMiddleware.verifyToken);
// router.get("/unauth/savehistory", AuthMiddleware.verifyToken);
// router.get("/unauth/joinroom", AuthMiddleware.verifyToken);
// router.get("/joinroom", AuthMiddleware.verifyToken);
// router.post("/savehistory", AuthMiddleware.verifyToken);
// router.post("/getUrlmeet", AuthMiddleware.verifyToken);
// router.post("/schedulemeeting", AuthMiddleware.verifyToken);
// router.put("/updateschedule", AuthMiddleware.verifyToken);

// router.put("/updateOnebox", AuthMiddleware.verifyToken);
// router.post("/startschedule", AuthMiddleware.verifyToken);
// router.post("/getschedule", AuthMiddleware.verifyToken);
// router.put("/settingroom", AuthMiddleware.verifyToken);
// router.put("/updateTypeSendOTP", AuthMiddleware.verifyToken);
// router.get("/history", AuthMiddleware.verifyToken);
// router.post("/sharemeeting", AuthMiddleware.verifyToken);
// router.post("/checkmeetting", AuthMiddleware.verifyToken);
// router.post("/logout", AuthMiddleware.verifyToken);
// router.post("/hangup");
// router.get("/getreport/:meetingid");
// router.post("/getkeyroom", AuthMiddleware.verifyToken);
// router.get("/downloadreport/:meetingid", AuthMiddleware.verifyToken);
// router.post("/sendinvite", AuthMiddleware.verifyToken);
// router.post("/checkKey");
// router.post("/getApprove");
// router.post("/getApproveByUser");
// router.post("/setMuteAll");

// // api uid
// router.post("/checkUid");
// router.post("/settimelastuser");
// router.post("/checkRecord");
// router.get("/getAllroom", AuthMiddleware.verifyToken);
// router.delete("/delScheduleroom", AuthMiddleware.verifyToken);
// router.delete("/delrecordfile", AuthMiddleware.verifyToken);

module.exports = router;
