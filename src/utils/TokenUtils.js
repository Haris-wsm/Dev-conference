// Library
const jwt = require("jsonwebtoken");

// Utils
const DateUtils = require("./DateUtils");
const HashUtils = require("./HashUtils");
const LoggerUtils = require("./LoggerUtils");

// Environments
const env = require("../config/env");

// Error handling
const AuthorizationException = require("../error/AuthorizationException");
const ExternalErrorException = require("../error/ExternalErrorException");

class TokenUtils {
  decodeExpTime(token) {
    try {
      const decodeToken = jwt.verify(token, env.secret_token);
      return decodeToken.exp;
    } catch (error) {
      throw new ValidationException("Invalid verify token");
    }
  }

  async signLoginToken(user, room, service) {
    try {
      const token = await jwt.sign({ user, room, service }, env.secret_token, {
        expiresIn: "24h",
      });

      const encodeToken = HashUtils.encodeJS(token);

      const session = new Sessionuser({
        username: user.username,
        email: user.email,
        oneid: user.oneid,
        token: encodeToken,
        access_token: access_token,
        refresh_token: refresh_token,
      });
      await session.save();

      LoggerUtils.info(
        `email: ${HashUtils.decode(
          session.email
        )}, username: ${HashUtils.decode(
          session.username
        )}, message: Login successfully by one collab mail, service: ${
          service.service
        }`
      );

      return {
        expiration_date: DateUtils.expiretoken(this.decodeExpTime(token), ""),
        username: user.username,
        token: encodeToken,
      };
    } catch (error) {
      throw new AuthorizationException("Invalid Token");
    }
  }

  async sign(data) {
    const token = await jwt.sign(data, env.secret_token, { expiresIn: "24h" });
    return token;
  }

  async verify(token) {
    const decoded = await jwt.verify(token, env.secret_token);
    return decoded;
  }

  async refreshToken(token) {
    const data = {
      grant_type: "refresh_token",
      refresh_token: HashUtils.decodeAccessToken(token),
      client_id: env.ONEID_CLIENT_ID,
      client_secret: env.ONEID_CLIENT_SECRET,
    };

    let acessTokenResponse;
    try {
      acessTokenResponse = await axios.post(env.ONEID_API_REFRESH_TOKEN, data);
    } catch (error) {
      LoggerUtils.error(
        `Failed to request for get access token at ${env.ONEID_API_REFRESH_TOKEN}`
      );

      throw new ExternalErrorException(`Invalid get access token`);
    }

    const status = acessTokenResponse.data.result;
    const tokenData = getAccesstoken.data;

    if (status !== "Success") return { status: "error" };

    const access_token = tokenData.access_token;
    const refresh_token = tokenData.refresh_token;

    return {
      status: "success",
      access_token,
      refresh_token,
    };
  }

  async refreshTokenCollab(token) {
    const data = {
      grant_type: "refresh_token",
      refresh_token: HashUtils.decodeAccessToken(token),
      client_id: env.ONEID_CLIENT_ID_COLLAB,
      client_secret: env.ONEID_CLIENT_SECRET_COLLAB,
    };

    let response;
    try {
      response = await axios.post(env.ONEID_API_REFRESH_TOKEN, data);
    } catch (error) {
      LoggerUtils.error(
        `Failed to request API refresh token: ${env.ONEID_API_REFRESH_TOKEN}`
      );
      throw new ExternalErrorException(`Failed to request for refresh token`);
    }

    const status = response.data.result;
    const apiTokenData = response.data;

    if (status !== "Success") return { status: "error" };

    const access_token = apiTokenData.access_token;
    const refresh_token = apiTokenData.refresh_token;
    return {
      status: "success",
      access_token,
      refresh_token,
    };
  }
}

module.exports = new TokenUtils();
