const router = require("express").Router();
const RoleControllers = require("./controller");

router.post("/", RoleControllers.create);

module.exports = router;
