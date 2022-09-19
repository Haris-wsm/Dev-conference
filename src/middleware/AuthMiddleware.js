const jwt = require("jsonwebtoken");

const env = require("../config/env");
const HashUtils = require("../utils/HashUtils");

class AuthMiddleware {
  async verifyToken(req, res, next) {
    const authorization = req.headers["authorization"];
    const token = authorization?.split(" ")[1];

    if (!authorization || !token) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    let authData;
    try {
      authData = await jwt.verify(HashUtils.decodeJS(token), env.secret_token);
    } catch (error) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
      });
    }

    req.authData = authData;
    req.token = token;
    next();
  }
}

module.exports = new AuthMiddleware();
