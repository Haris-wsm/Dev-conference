//* User Services
const UserService = require("./services");

class UserController {
  async registerOneId(req, res, next) {
    const registeredOneId = await UserService.registerByOneId(req.body);

    console.log(registeredOneId);
    res.send({
      status: "success",
      message: `${registeredOneId.data.email} Register successfully.`,
      email: registeredOneId.data.email,
    });
  }

  decodeData(req, res, next) {
    try {
      const data = UserService.decodeData(req.body);
      res.status(200).send({ status: "success", data: `${data}` });
    } catch (error) {
      next(error);
    }
  }

  decodeDataJs(req, res, next) {
    try {
      const data = UserService.decodeDataJs(req.body);
      res.status(200).send({ status: "success", data: `${data}` });
    } catch (error) {
      next(error);
    }
  }

  encodeData(req, res, next) {
    try {
      const data = UserService.encodeData(req.body);
      res.status(200).send({ status: "success", data: `${data}` });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const data = await UserService.changePassword(req.authData);
      res.send({
        status: "success",
        message: `Send email ${data.email} for recovery password.`,
        email: data.email,
      });
      // res.send();
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  async checkUserRole(req, res, next) {
    try {
      const data = await UserService.getRole(req.authData);

      res.send({
        status: "success",
        role: data,
        privilege: {
          schedule: !(data.name == "citizen"),
          secret: data.name == "host",
          guest: true,
        },
      });
    } catch (error) {
      console.log(error);
      // next(error);
    }
  }

  async showLOAlevel(req, res, next) {
    try {
      const data = await UserService.findLevelByLOA(req.authData);

      res.send({
        status: "success",
        room: data.room,
        data: data.data,
      });
    } catch (error) {
      next(error);
    }
  }

  async joinByLevelLOA(req, res, next) {
    try {
      const { uuid } = req.body;
      const objResponse = await UserService.joinByLevelLOA(req.authData, uuid);
      res.send(objResponse);
    } catch (error) {
      next(error);
    }
  }

  //* TODO: Check how to send "otp", is that "otp" exist or not
  async upgreadeLOA(req, res, next) {
    try {
      const data = await UserService.upgradeLOA(req.authData);

      res.send({
        status: "success",
        message: "OTP send.",
        phonenumber: data.phonenumber,
      });
    } catch (error) {
      next(error);
    }
  }

  async checkOtpUpgradeLOA(req, res, next) {
    try {
      const { otp } = req.body;

      const data = await UserService.checkOtpUpgradeLOA(req.authData, otp);
      res.send(data);
    } catch (error) {
      res.send(403).send({ status: "error", message: "Something went wrong" });
    }
  }

  async delete(req, res, next) {
    try {
      await UserService.delete(req.body, req.token);
      res.send({ status: "success", message: "Delete user successfully." });
    } catch (error) {
      next(error);
    }
  }

  async getBusiness(req, res, next) {
    try {
      const data = await UserService.getBusiness(req.authData);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }

  async checkOneBox(req, res, next) {
    try {
      const data = await UserService.checkOneBox(req.authData);

      res.send(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
