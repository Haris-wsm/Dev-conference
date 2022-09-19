const AuthService = require("./services");

// Testing

class AuthController {
  async loginCollabMail(req, res, next) {
    try {
      const data = await AuthService.loginCollabMail(req.body);

      res.send(data);
    } catch (error) {
      console.log(error);
      // next(error);
    }
  }

  async loginOneId(req, res, next) {
    try {
      const data = await AuthService.loginOneId(
        req.body,
        req.headers["x-forwarded-for"]
      );
      res.send(data);
      // res.send({});
    } catch (error) {
      next(error);
    }
  }

  async collab(req, res, next) {
    try {
      console.log(req.body);
      const data = await AuthService.collab(req.body);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async logout(req, res, next) {
    try {
      const data = await AuthService.logout(req.authData);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const data = await AuthService.refreshToken(req.body);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }

  async refreshTokenCollab(req, res, next) {
    try {
      const data = await AuthService.registerOTP(req.body);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async registerOTP(req, res, next) {
    try {
      await AuthService.registerOTP(req.body, req.token);
      res.send();
    } catch (error) {
      next(error);
    }
  }
  async checkTokenExpire(req, res, next) {
    try {
      await AuthService.checkTokenExpire(req.body, req.token);
      res.send();
    } catch (error) {
      next(error);
    }
  }
  async sharedToken(req, res, next) {
    try {
      const data = await AuthService.sharedToken(req.token);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async sharedtokenDGA(req, res, next) {
    try {
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
