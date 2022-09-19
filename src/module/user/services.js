// Utility helper functions
const SendMail = require("../../utils/email/SendMail");
const OneIdUtils = require("../../utils/OneIdUtils");
const HashUtils = require("../../utils/HashUtils");
const OneBoxUtils = require("../../utils/OneBoxUtils");
const DateUtils = require("../../utils/DateUtils");
const LoggerUtils = require("../../utils/LoggerUtils");

// Services helper
const RoomService = require("../../module/room/services");

// Error exception handler
const ValidationException = require("../../error/ValidationException");
const AuthorizationException = require("../../error/AuthorizationException");
const ExternalErrorException = require("../../error/ExternalErrorException");

// Environments
const env = require("../../config/env");

// Models
const SessionUser = require("../../model/sessionUser");
const User = require("../../model/user");
const Room = require("../../model/room");
const Role = require("../../model/role");
const Business = require("../../model/business");
const DeleteUser = require("../../model/deleteUser");
const SessionRoom = require("../../model/sessionRoom");
const Onebox = require("../../model/onebox");
const Oneboxfile = require("../../model/oneboxFiles");
const HistoryRoom = require("../../model/historyRoom");
const ScheduleMeeting = require("../../model/scheduleMeeting");

// Library
const jwt = require("jsonwebtoken");
const axios = require("axios");

class UserService {
  async registerByOneId(body) {
    const {
      username,
      password,
      passwordconfirm,
      name,
      lastname,
      phonenumber,
      company,
    } = body;

    if (password !== passwordconfirm)
      throw new ValidationException("The password does not match");

    const registeredOneID = await OneIdUtils.register(
      username,
      password,
      name,
      lastname,
      phonenumber
    );

    if (registeredOneID) {
      if (registeredOneID.result == "Success") {
        const role = await Role.findOne({ name: "citizen" }, "_id");
        const user = new User({
          username: HashUtils.encode(username),
          email: HashUtils.encode(registeredOneID.data.email),
          name: HashUtils.encode(name),
          lastname: HashUtils.encode(lastname),
          phonenumber: HashUtils.encode(phonenumber),
          company: HashUtils.encode(company),
          oneid: registeredOneID.data.accountID,
          room_id: "",
          role: role._id,
          avatar_profile: `${env.DOMAIN}/image/profile/userdefault.png`,
          verifyemail: true,
          created_at: Date.now(),
          updated_at: Date.now(),
        });

        console.log(await RoomService.getRoomUid(user));
        // * Create a Room Model where belongs to a User Model
        const room = new Room({
          user_id: user._id,
          name: "Meeting Room",
          uid: await RoomService.getRoomUid(user),
          key: HashUtils.encode("123roominet!"),
          setting: {
            SecretRoom: false,
            OneboxAccountid: "",
            ApproveUserJoin: true,
            MuteAll: false,
          },
          created_at: Date.now(),
          updated_at: Date.now(),
        });

        // * Create a new room and a user from models.
        user.room_id = room._id;
        await Promise.all([user.save(), room.save()]);

        console.log("Create Model Success");

        //* Sending Confirm Signup Email
        try {
          await SendMail.confirmEmail(
            user.email,
            HashUtils.decode(user.name),
            HashUtils.decode(user.lastname)
          );

          console.log("Send email successfully");
        } catch (error) {
          console.log(error);
        }

        try {
          LoggerUtil.info(
            `email: ${registeredOneID.data.email}, username: ${username}, message: Register successfully.`
          );
        } catch (error) {
          console.log(error);
        }

        return registeredOneID;
      }

      const { errorMessage } = registeredOneID;
      const errorResponse = Object.values(errorMessage)[0][0];

      const responseMessage =
        errorResponse === undefined
          ? registeredOneID.result
          : errorResponse === "username duplicate"
          ? "This username is already used."
          : errorResponse;

      throw new ValidationException(responseMessage);
    }
    LoggerUtils.error(`Failed to register One ID`);
    throw new ValidationException("Register oneid fail.");
  }

  decodeData(body) {
    return HashUtils.decode(body.input);
  }

  decodeDataJs(body) {
    return HashUtils.decodeJS(body.input);
  }

  encodeData(body) {
    return HashUtils.encode(body.input);
  }

  async changePassword(token) {
    const sessionData = await SessionUser.findOne(
      {
        email: token.user.email,
      },
      { username: 1, email: 1 }
    );

    if (!sessionData) throw AuthorizationException("No session user.");

    const response = await this.resetPassword(data.username);

    if (response.result == "Success") {
      LoggerUtils.info(
        `email: ${HashUtils.decode(
          sessionData.email
        )}, username: ${HashUtils.decode(
          sessionData.username
        )}, message: Request forgot password.`
      );

      return { ...sessionData, email: HashUtils.decode(data.email) };
    }
    throw AuthorizationException("Invalid Email.");
  }

  async resetPassword(username) {
    const data = {
      username: HashUtils.decode(username),
      secretkey: env.ONEID_CLIENT_SECRET,
      refcode: env.ONEID_REF_CODE,
      client_id: env.ONEID_CLIENT_ID,
    };

    let response;
    try {
      response = await axios.post(env.ONEID_API_GET_EMAIL_BY_USERNAME, data);
    } catch (error) {
      LoggerUtils.error(
        `Failed to request for get One ID email with data username at ${env.ONEID_API_GET_EMAIL_BY_USERNAME}`
      );
      throw new ExternalErrorException(`Failed to get user's email`);
    }

    const status = response.data.result;
    if (status === "Success") {
      const user = await User.findOne({ username });

      if (user) {
        const email = {
          username: HashUtils.decode(username),
          secretkey: env.ONEID_CLIENT_SECRET,
          refcode: env.ONEID_REF_CODE,
          client_id: env.ONEID_CLIENT_ID,
          email: HashUtils.decode(user.email),
        };

        try {
          const { data } = await axios.post(
            env.ONEID_API_RESET_PASSWORD,
            email
          );
          return data;
        } catch (error) {
          throw new ExternalErrorException(
            `Failed to request to reset password at ${env.ONEID_API_RESET_PASSWORD}`
          );
        }
      }
    }

    throw new ValidationException(`Invalid username`);
  }

  async getRole(token) {
    const role = await Role.findOne({ _id: token.user.role }, "name");

    if (!role) throw new ValidationException("Invalid Role ID");

    return role;
  }

  async findLevelByLOA(token) {
    const userSessionData = await SessionUser.findOne(
      { email: token.user.email },
      "access_token"
    );

    if (!userSessionData)
      throw new ValidationException("Invalid to find LOA Level");

    const accessToken = userSessionData.access_token;
    const roomSetting = token.room.setting;
    const loaLevelData = await OneIdUtils.findLevelByLOA(
      accessToken,
      roomSetting
    );

    return loaLevelData;
  }

  async joinByLevelLOA(token, uuid) {
    const data = await SessionUser.findOne(
      { email: token.user.email },
      "access_token"
    );

    if (!data) throw new AuthorizationException("No session user.");

    const accessToken = HashUtils.decodeAccessToken(data.access_token);
    const { data: level } = await OneIdUtils.getLoaLevel(accessToken);
    const room = await session_room.findOne({ uid: uuid }, "setting");

    if (!room) throw ValidationException("Invalid UID.");
    if (level.result !== "Success")
      throw ValidationException("Failed to check level.");

    if (room.setting.SecretRoom !== true) {
      if (level.loa_level <= 0)
        throw ValidationException("Failed to verify LOA with level 1");
      return { status: "success", message: "Join  meeting" };
    }

    if (level.loa_level < 1)
      throw ValidationException("Failed to verify LOA with level 1", {
        load1: level.loa1,
        loa2: level.loa2,
      });

    if (level.loa1 === "Y" && level.loa2 === "Y")
      return { status: "success", message: "Join secret meeting" };

    if (level.loa1 === "Y" && level.loa2 === "N")
      throw ValidationException("Failed to verify LOA with level 2", {
        load1: level.loa1,
        loa2: level.loa2,
      });

    throw ValidationException("Failed to verify LOA with level 1", {
      load1: level.loa1,
      loa2: level.loa2,
    });
  }

  async upgradeLOA(token) {
    const data = await SessionUser.findOne(
      { email: authData.user.email },
      "access_token"
    );

    if (!data) throw ValidationException("No session user.");

    const { phonenumber } = await User.findById(token, { phonenumber: 1 });

    const accessToken = HashUtils.decodeAccessToken(data.access_token);
    const status = await OneIdUtils.upgradeLOA(accessToken);

    if ("result" in status && status.result === "Success") {
      return { phonenumber: HashUtils.decode(phonenumber) };
    }

    const errorMessage =
      "data" in status ? status.data.errorMessage : "OTP send fail.";

    throw new ValidationException(errorMessage);
  }

  async checkOtpUpgradeLOA(token, otp) {
    const data = await SessionUser.findOne(
      { email: token.user.email },
      "access_token"
    );

    if (!data) throw new AuthorizationException("No session user");

    const accessToken = HashUtils.decodeAccessToken(data.access_token);
    const status = await OneIdUtils.upgradeLoaByOtp(accessToken, otp);

    if (status.result === "Success") {
      return { status: "success", message: "OTP is correct." };
    }

    throw new ValidationException("Failed to check OTP for upgradeLOA LOA");
  }

  async delete(body, token) {
    if (token !== env.admintoken)
      throw new AuthorizationException("Unauthorize");

    const user = await User.findOne(
      { username: encode(body.username), email: encode(body.email) },
      ["oneid", "_id", "email", "username"]
    );

    if (!user) {
      LoggerUtils.error(`ADMIN , message: User not found.`);
      throw new ValidationException("User not found.");
    }

    const { oneid, _id, email, username } = user;

    const deleteQueries = [
      DeleteUser.create({ oneid: oneid }),
      SessionRoom.deleteOne({ oneid: oneid }),
      SessionUser.deleteOne({ user_id: _id }),
      Rooms.deleteOne({ user_id: _id }),
      Onebox.deleteMany({ oneid: oneid }),
      Oneboxfile.deleteMany({ user_id: _id }),
      HistoryRoom.deleteMany({ user_id: _id }),
      ScheduleMeeting.deleteMany({ user_id: _id }),
    ];

    try {
      await Promise.all(deleteQueries);
      await user.delete();
    } catch (error) {
      LoggerUtils.error(
        `Failed to delete a bunch of other models that belong with One ID of user.`
      );
      throw new ExternalErrorException(
        `Failed to delete info with One id of user.`
      );
    }

    LoggerUtils.info(
      `email: ${HashUtils.decode(email)}, username: ${HashUtils.decode(
        username
      )}, message: delete user from admin.`
    );
  }

  async getBusiness(token) {
    const data = await SessionUser.findOne(
      { email: token.user.email },
      "access_token"
    );

    if (!data) throw new AuthorizationException("No session user");

    const accessToken = HashUtils.decodeAccessToken(checkToken.access_token);
    const newBusiness = await OneBoxUtils.getBusiness(accessToken);
    const userBusiness = await Business.findOne({
      email: token.user.email,
    });

    if (!userBusiness) {
      await Business.create({
        username: token.user.username,
        email: token.user.email,
        business: newBusiness,
      });

      return { status: "success", message: "Create new business successfully" };
    }

    if (!newBusiness) {
      return { status: "success", message: "business undefined" };
    }

    if (newBusiness.length !== userBusiness.length) {
      await Business.findOneAndUpdate(
        {
          $or: [{ username: token.user.username }, { email: token.user.email }],
        },
        {
          $set: {
            business: newBusiness,
          },
        },
        {
          fields: {
            __v: 0,
          },
          new: true,
        }
      );

      return { status: "success", message: "Updated business successfully." };
    }

    return { status: "success", message: "Same business." };
  }

  async checkOneBox(token) {
    const service = { service: "oneid" };

    const userToken = await Sessionuser.findOne({
      email: token.user.email,
      oneid: token.user.oneid,
    });

    const accessToken = HashUtils.decodeAccessToken(userToken.access_token);

    // TODO: Add function "getonebox"
    const oneBoxData = await OneBoxUtils.getOneBox(
      accessToken,
      token.user.oneid
    );

    const user = await User.findOne({
      $or: [
        { username: encode(authData.user.username) },
        { email: encode(authData.user.email) },
        { oneid: authData.user.oneid },
      ],
    });

    const sessionUser = await SessionUser.findOne({
      $or: [{ username: user.username }, { email: user.email }],
    });

    if (!user) throw new ValidationException("Can not find a user");

    const room = await Room.findOneAndUpdate(
      { user_id: user._id },
      {
        $set: {
          "setting.OneboxAccountid": dataOnebox.account_id,
          updated_at: Date.now(),
        },
      },
      {
        fields: {
          created_at: 0,
          updated_at: 0,
          last_session: 0,
          __v: 0,
        },
        new: true,
      }
    );

    if (sessionUser) {
      // TODO: if jwt sign is asyncronus, check it later

      try {
        const token = jwt.sign({ user, room, service }, env.secret_token, {
          expiresIn: "24h",
        });

        const encodeToken = HashUtils.encodeJS(token);
        sessionuser.token = encodeToken;
        sessionuser.updated_at = Date.now();
        await sessionuser.save();

        LoggerUtils.info(
          `email: ${decode(sessionuser.email)}, username: ${decode(
            sessionuser.username
          )}, message: Successfully, service: ${service.service}`
        );

        return {
          status: "Success",
          expiration_date: DateUtils.expiretoken(
            jwttoken.DecodeExpTime(token),
            ""
          ),
          username: user.username,
          token: encodeToken,
        };
      } catch (error) {
        throw new Error("Invalid get token");
      }
    }
  }
}

module.exports = new UserService();
