// Models
const SessionUser = require("../../model/sessionUser");
const Users = require("../../model/user");
const Rooms = require("../../model/room");

// Utils
const DateUtils = require("../../utils/DateUtils");
const TokenUtils = require("../../utils/TokenUtils");
const AuthorizationException = require("../../error/AuthorizationException");
const LoggerUtils = require("../../utils/LoggerUtils");
const OneIdUtils = require("../../utils/OneIdUtils");
const HashUtils = require("../../utils/HashUtils");

// Error Exception handler
const ValidationException = require("../../error/ValidationException");
const ExternalErrorException = require("../../error/ExternalErrorException");

class AuthServices {
  async loginCollabMail(body) {
    const { one_collab_mail, password } = body;

    const auth = await OneIdUtils.loginCollabMail(one_collab_mail, password);

    const hasAuthValue = Object.keys(auth).length;
    if (!hasAuthValue) {
      LoggerUtils.error(
        `username: ${one_collab_mail}, message: username or password is incorrect!.`
      );

      throw new ValidationException("Username or password incorrect!");
    }

    const user = auth.user;
    const room = auth.room;
    const access_token = HashUtils.encodeAccessToken(auth.access_token);
    const refresh_token = HashUtils.encodeAccessToken(auth.refresh_token);

    const status = auth.status;
    if (status === "errorverification") {
      try {
        LoggerUtils.error(
          `username: ${HashUtils.decode(
            user.username
          )}, message: Please check your account verification.`
        );
      } catch (error) {}

      throw new ValidationException("Please check your account verification");
    }
    if (status == "Success") {
      const sessionUserData = await SessionUser.findOne({
        $or: [{ username: user.username }, { email: user.email }],
      });

      const service = { service: "dga" };

      let token;
      try {
        token = jwt.sign({ user, room, service }, env.SECRET_TOKEN, {
          expiresIn: "24h",
        });
      } catch (error) {
        throw new ValidationException("Invalid sign token");
      }

      const encodeToken = HashUtils.encodeJS(token);

      if (!sessionUserData) {
        let session = new SessionUser({
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
          status: "Login successfully",
          expiration_date: DateUtils.expireToken(
            TokenUtils.decodeToken(token),
            ""
          ),
          username: user.username,
          token: encodeToken,
        };
      }

      sessionUserData.username = user.username;
      sessionUserData.email = user.email;
      sessionUserData.token = encodeToken;
      sessionUserData.access_token = access_token;
      sessionUserData.refresh_token = refresh_token;
      sessionUserData.updated_at = Date.now();
      await sessionUserData.save();

      LoggerUtils.info(
        `email: ${decode(sessionuser.email)}, username: ${decode(
          sessionuser.username
        )} , message: Login successfully by one collab mail, service: ${
          service.service
        }`
      );

      return {
        status: "Login successfully",
        expiration_date: DateUtils.expiretoken(
          TokenUtils.decodeExpTime(token),
          ""
        ),
        username: user.username,
        token: encodeToken,
      };
    }

    LoggerUtils.error(
      `username: ${one_collab_mail}, message: username or password is incorrect!.`
    );

    throw new ValidationException("username or password incorrect!");
  }

  async loginOneId(body, header) {
    try {
      const response = await OneIdUtils.loginOneId(
        body.username,
        body.password
      );

      if (!Object.keys(response).length) {
        LoggerUtils.error(
          `username: ${body.username}, message: username or password is incorrect!.`
        );
        throw new ValidationException("Username or password incorrect!");
      }

      const user = response.user;
      const room = response.room;
      const access_token = HashUtils.encodeAccessToken(response.access_token);
      const refresh_token = HashUtils.encodeAccessToken(response.refresh_token);

      if (
        response.status !== "Success" &&
        response.status !== "errorverification"
      ) {
        LoggerUtils.error(`message: username or password is incorrect!.`);
        throw new ValidationException("Username or password incorrect!");
      }
      if (response.status === "Success") {
        const sessionUser = await SessionUser.findOne({
          $or: [{ username: user.username }, { email: user.email }],
        });

        const service = { service: "dga" };

        const myip = header;

        let token;
        let encodeToken;
        try {
          token = await TokenUtils.sign({ user, room, service });
          encodeToken = HashUtils.encodeJS(token);
        } catch (error) {
          LoggerUtils.error("Failed to sign token");
          throw new AuthorizationException("Invalid token");
        }

        if (!sessionUser) {
          let session = new SessionUser({
            username: user.username,
            email: user.email,
            oneid: user.oneid,
            token: encodeToken,
            access_token: access_token,
            refresh_token: refresh_token,
          });

          await session.save();

          LoggerUtils.info(
            `email: ${HashUtils.decode(session.email)}, username: ${decode(
              session.username
            )}, message: Login successfully, service: ${
              service.service
            }, IP: ${myip} `
          );

          return {
            status: "Login successfully",
            expiration_date: DateUtils.expireToken(
              TokenUtils.decodeExpTime(token),
              ""
            ),
            username: user.username,
            token: encodeToken,
          };
        }

        sessionUser.username = user.username;
        sessionUser.email = user.email;
        sessionUser.token = encodeToken;
        sessionUser.access_token = access_token;
        sessionUser.refresh_token = refresh_token;
        sessionUser.updated_at = Date.now();
        await sessionUser.save();

        LoggerUtils.info(
          `email: ${HashUtils.decode(
            sessionUser.email
          )}, username: ${HashUtils.decode(
            sessionUser.username
          )} , message: Login successfully, IP: ${myip}`
        );

        return {
          status: "Login successfully",
          expiration_date: DateUtils.expireToken(
            TokenUtils.decodeExpTime(token),
            ""
          ),
          username: user.username,
          token: encodeToken,
        };
      }

      if (response.status === "errorverification") {
        LoggerUtils.error(
          `username: ${HashUtils.decode(
            user.username
          )}, message: Please check your account verification.`
        );

        return {
          status: "error",
          message: "Please check your account verification.",
        };
      }
    } catch (error) {
      console.log(error.response.data);
    }
  }

  async collab(body) {
    const { email, password } = body;

    const auth = await OneIdUtils.loginCollab(email, password);
    console.log(auth);
    const status = auth.status;
    let hasAuthValue = Object.keys(auth).length;

    if (!hasAuthValue) {
      LoggerUtils.error(
        `email: ${auth.user.username}, message: username or password is incorrect!.`
      );

      return { status: "error", message: "username or password incorrect!." };
    }

    if (status !== "Success" && status !== "errorverification") {
      return { status: auth.status, message: auth.message };
    }

    const user = auth.user;
    const room = auth.room;
    const access_token = HashUtils.encodeAccessToken(auth.access_token);
    const refresh_token = HashUtils.encodeAccessToken(auth.refresh_token);

    if (status === "Success") {
      const sessionuser = await SessionUser.findOne({
        $or: [{ username: user.username }, { email: user.email }],
      });
      const service = { service: "dga" };

      const token = await TokenUtils.sign({ user, room, service });
      const encodeToken = HashUtils.encodeJS(token);

      if (!sessionuser) {
        let session = new SessionUser({
          username: user.username,
          email: user.email,
          oneid: user.oneid,
          token: encodeToken,
          access_token: access_token,
          refresh_token: refresh_token,
        });

        await session.save();

        LoggerUtils.info(
          `email: ${session.email}, message: Login successfully, service: ${service.service}`
        );

        return {
          status: "Login successfully",
          expiration_date: DateUtils.expireToken(
            TokenUtils.decodeExpTime(token),
            ""
          ),
          username: user.username,
          token: encodeToken,
        };
      }

      sessionuser.email = user.email;
      sessionuser.token = encodeToken;
      sessionuser.access_token = access_token;
      sessionuser.refresh_token = refresh_token;
      sessionuser.updated_at = Date.now();
      await sessionuser.save();

      LoggerUtils.info(
        `email: ${sessionuser.email}, message: Login successfully service: ${service.service}`
      );

      return {
        status: "Login successfully",
        expiration_date: DateUtils.expireToken(
          TokenUtils.decodeExpTime(token),
          ""
        ),
        username: user.username,
        email: user.email,
        token: encodeToken,
      };
    }

    if (status === "errorverification") {
      LoggerUtils.log(
        `email: ${user.username}, message: Please check your account verification.`
      );

      return {
        status: "error",
        message: "Please check your account verification.",
      };
    }
  }
  async logout(userData) {
    let session = await SessionUser.findOne({
      email: userData.user.email,
    });

    if (!session) throw new AuthorizationException("No session user");

    await session.delete();
    LoggerUtils.info(
      `email: ${HashUtils.decode(session.email)}, username: ${HashUtils.decode(
        session.username
      )}, message: Logout successfully`
    );

    return { status: "success", message: "Logout successfully" };
  }

  async refreshToken(body) {
    const { username, email, oneid } = body;

    let sessionuser;
    try {
      sessionuser = await SessionUser.findOne({ email, username, oneid }, [
        "access_token",
        "refresh_token",
        "email",
        "username",
      ]);
    } catch (error) {
      throw new ExternalErrorException("Failed to retrieve data from Database");
    }

    if (!sessionuser) throw new ValidationException("No session user");

    const userData = await Users.findOne(
      { email: sessionuser.email },
      {
        verifyemail: 0,
        license: 0,
        limit: 0,
        updated_at: 0,
        created_at: 0,
        last_session: 0,
        __v: 0,
      }
    );

    const room = await Rooms.findOne(
      { user_id: userData._id },
      { created_at: 0, updated_at: 0, last_session: 0, __v: 0 }
    );

    const newToken = await TokenUtils.refreshToken(sessionuser.refresh_token);

    const hasTokenValue = Object.keys(newToken).length;

    if (!hasTokenValue) {
      throw new ValidationException("Failed to get refresh token value");
    }

    const status = newToken.status;
    if (status !== "success") {
      throw new ValidationException("Failed to get refresh token value");
    }

    const access_token = HashUtils.encodeAccessToken(newToken.access_token);
    const refresh_token = HashUtils.encodeAccessToken(newToken.refresh_token);

    let user = userData.toObject();
    const service = { service: "oneid" };

    let token;
    try {
      token = await TokenUtils.sign({ user, room, service });
    } catch (error) {
      LoggerUtils.error(`Failed to sign token with jwt`);
      throw new ValidationException(`Invalid sign token`);
    }

    const encodeToken = HashUtils.encodeJS(token);
    sessionuser.token = encodeToken;
    sessionuser.access_token = access_token;
    sessionuser.refresh_token = refresh_token;
    sessionuser.updated_at = Date.now();
    await sessionuser.save();

    LoggerUtils.info(
      `email: ${HashUtils.decode(
        sessionuser.email
      )}, username: ${HashUtils.decode(
        sessionuser.username
      )}, message: get new accesstoken successfully`
    );

    return {
      status: "get new accesstoken successfully",
      expiration_date: DateUtils.expireToken(
        TokenUtils.decodeExpTime(token),
        ""
      ),
      username: user.username,
      token: encodeToken,
    };
  }
  async refreshTokenCollab(body) {
    const { username, email, oneid } = req.body;

    let sessionuser;
    try {
      sessionuser = await SessionUser.findOne(
        { email: email, username: username, oneid: oneid },
        ["access_token", "refresh_token", "email", "username"]
      );
    } catch (error) {
      LoggerUtils.error(`Failed to retrieve user session from database`);
      throw new ExternalErrorException(`Failed to get user session`);
    }

    if (!sessionuser) throw new ValidationException(`No session user`);

    const userData = await Users.findOne(
      { email: sessionuser.email },
      {
        verifyemail: 0,
        license: 0,
        limit: 0,
        updated_at: 0,
        created_at: 0,
        last_session: 0,
        __v: 0,
      }
    );
    const roomData = await Rooms.findOne(
      { user_id: userData._id },
      { created_at: 0, updated_at: 0, last_session: 0, __v: 0 }
    );

    const newToken = await TokenUtils.refreshTokenCollab(
      sessionuser.refresh_token
    );

    if (!Object.keys(getnewToken).length)
      throw new ValidationException(`No session user`);

    const status = newToken.status;
    if (status !== "success")
      throw new ValidationException(`Get refreshToken fail.`);

    const access_token = HashUtils.encodeAccessToken(getnewToken.access_token);
    const refresh_token = HashUtils.encodeAccessToken(newToken.refresh_token);
    let user = userData.toObject();
    const service = { service: "dga" };

    let signToken;
    try {
      signToken = await TokenUtils.sign({ user, room, service });
    } catch (error) {
      LoggerUtils.error(`Failed to sign token`);
      throw new AuthorizationException(`Invalid token`);
    }

    const encodeToken = HashUtils.encodeJS(token);
    sessionuser.token = encodeToken;
    sessionuser.access_token = access_token;
    sessionuser.refresh_token = refresh_token;
    sessionuser.updated_at = Date.now();
    await sessionuser.save();

    LoggerUtils.info(
      `email: ${HashUtils.decode(
        sessionuser.email
      )}, username: ${HashUtils.decode(
        sessionuser.username
      )}, message: get new accesstoken successfully`
    );

    return {
      status: "get new accesstoken successfully",
      expiration_date: DateUtils.expireToken(
        TokenUtils.decodeExpTime(signToken),
        ""
      ),
      username: user.username,
      token: encodeToken,
    };
  }
  async registerOTP(body, token) {
    const decodedToken = HashUtils.decodeJS(token);
    try {
      await TokenUtils.verify(decodedToken);
    } catch (error) {
      throw new AuthorizationException(`Invalid token`);
    }
  }
  async checkTokenExpire() {
    const decodedToken = HashUtils.decodeJS(token);
    try {
      await TokenUtils.verify(decodedToken);
    } catch (error) {
      throw new AuthorizationException(`Invalid token`);
    }
  }
  async sharedToken(token) {
    let response;
    try {
      response = await OneIdUtils.sharedToken(token);
    } catch (error) {
      LoggerUtils.error("Failed to get shared token from One ID");
      throw new ExternalErrorException("Failed to get shared token");
    }

    if (Object.keys(response_data).length === 0) {
      LoggerUtils.error("Failed to get shared token from One ID");
      throw new AuthorizationException(
        "Failed to get shared token with invalid token "
      );
    }

    const user = response.user;
    const room = response.room;
    const access_token = HashUtils.encodeAccessToken(response.access_token);
    const refresh_token = HashUtils.encodeAccessToken(response.refresh_token);

    const sessionuser = await SessionUser.findOne({
      $or: [{ username: user.username }, { email: user.email }],
    });

    const service = { service: "oneid" };

    let tokenSign;
    try {
      tokenSign = await TokenUtils.sign({ user, room, service });
    } catch (error) {
      throw new AuthorizationException("Invalid token");
    }
    const encodeToken = HashUtils.encodeJS(token);

    if (!sessionuser) {
      let session = new Sessionuser({
        username: user.username,
        email: user.email,
        oneid: user.oneid,
        token: encodeToken,
        access_token: access_token,
        refresh_token: refresh_token,
      });
      await session.save();

      LoggerUtils.info(
        `email: ${session.email}, message: Login successfully, service: ${service.service}`
      );

      return {
        status: "Login successfully",
        expiration_date: DateUtils.expireToken(
          TokenUtils.decodeExpTime(tokenSign),
          ""
        ),
        username: user.username,
        token: encodeToken,
      };
    }

    sessionuser.token = encodeToken;
    sessionuser.access_token = access_token;
    sessionuser.username = user.username;
    sessionuser.refresh_token = refresh_token;
    sessionuser.updated_at = Date.now();
    await sessionuser.save();

    LoggerUtils.info(
      `email: ${HashUtils.decode(
        sessionuser.email
      )}, username: ${HashUtils.decode(
        sessionuser.username
      )}, message: Login with share token successfully`
    );

    return {
      status: "Login with share token successfully",
      expiration_date: DateUtils.expireToken(
        TokenUtils.decodeExpTime(token),
        ""
      ),
      username: user.username,
      token: encodeToken,
    };
  }
  async sharedtokenDGA() {}
}

module.exports = new AuthServices();
