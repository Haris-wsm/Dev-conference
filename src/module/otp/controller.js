const OtpService = require("./services");

class OtpController {
  async sendOTP(req, res, next) {
    try {
      const data = await OtpService.sendOTP(req.authData);

      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async checkOTP(req, res, next) {
    try {
      const data = await OtpService.checkOTP(req.authData, req.parms.OTP);

      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async testOTP(req, res, next) {
    try {
      const data = await OtpService.testOTP();
      res.send({ data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OtpController();
