// Services helper
const HashUtils = require("./HashUtils");

// Environments
const env = require("../config/env/index");

// Library
const axios = require("axios");

// Utils
const OneBoxUtils = require("../utils/OneBoxUtils");
const LoggerUtils = require("../utils/LoggerUtils");

// Models
const User = require("../model/user");
const Roles = require("../model/role");
const Rooms = require("../model/room");
const DeleteUser = require("../model/deleteUser");

// Services
const RoomService = require("../module/room/services");
const AuthorizationException = require("../error/AuthorizationException");

// DTOS
const RoomDTO = require("../dtos/RoomDTO");
const UserDTO = require("../dtos/UserDto");

// Errors Exception
const ExternalErrorException = require("../error/ExternalErrorException");

class OneIdUtils {
  async register(username, password, name, lastname, mobile_no) {
    const data = {
      username,
      password,
      first_name_eng: name,
      last_name_eng: lastname,
      mobile_no,
      ref_code: env.ONEID_REF_CODE,
      clientId: env.ONEID_CLIENT_ID,
      secretKey: env.ONEID_CLIENT_SECRET,
    };

    let response;
    try {
      response = await axios.post(env.ONEID_API_REGISTER, data);
      return response.data;
    } catch (error) {
      LoggerUtils.error(
        `Failed to request for register ONE ID at ${env.ONEID_API_REGISTER}`
      );
      throw new ExternalErrorException(`Failed to request register ONE ID`);
    }
  }

  async findLevelByLOA(accessToken, roomSetting) {
    const decodeAccessToken = HashUtils.decodeAccessToken(accessToken);
    const response = await this.getLoaLevel(decodeAccessToken);

    const room =
      roomSetting.SecretRoom === true ? "secret room" : "normal room";

    if (response.result === "Success") {
      const data = {
        room,
        data: {
          loa1: response.data.loa1,
          loa2: response.data.loa2,
        },
      };
      return data;
    }

    throw new ValidationException("Accesstoken was expired");
  }

  async getLoaLevel(accessToken) {
    const header = { headers: { Authorization: "Bearer " + accessToken } };

    try {
      const response = await axios.get(env.ONEID_CHECK_LOA_LEVEL, header);
      return response.data;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async upgradeLOA(accessToken) {
    const header = { headers: { Authorization: "Bearer " + accessToken } };

    try {
      const response = await axios.get(env.ONEID_SEND_OTP_UPGRADE_LOA, header);

      return response.data;
    } catch (error) {
      console.log(error);
      LoggerUtils.error(
        `Failed to request for get One id infomation with upgrade LOA by OTP at ${env.ONEID_SEND_OTP_UPGRADE_LOA}`
      );
      throw new ExternalErrorException(`Failed to get LOA by OTP`);
    }
  }

  async upgradeLoaByOtp(accessToken, otp) {
    const header = { headers: { Authorization: "Bearer " + accessToken } };

    try {
      const response = await axios.get(
        `${process.env.ONEID_UPGRADE_LOA_BY_OTP}/${otp}`,
        header
      );
      return response.data;
    } catch (error) {
      console.log(error);
      if ("response" in error) {
        return error.response;
      }
    }
  }

  async loginCollabMail(email, password) {
    // Check if ref_code is valid
    const data = {
      client_id: env.ONEID_CLIENT_ID_COLLAB,
      client_secret: env.ONEID_CLIENT_SECRET_COLLAB,
      refcode: env.ONEID_REF_CODE_COLLAB,
      one_collab_mail: email,
      password: password,
      scope:
        "account, title, first_name, last_name, id_card, birth_date, email, tel, pic",
    };

    try {
      const oneIdResponse = await axios.post(
        env.ONEID_API_LOGINCOLLABMAIL,
        data
      );

      const status = oneIdResponse.data.result;
      if (status === "Fail") return oneIdResponse.data.errorMessage;
      if (status === "Success") {
        const data = oneIdResponse.data;
        const username = data.username ?? "";
        const access_token = data.access_token;
        const refresh_token = data.refresh_token;

        const header = { headers: { Authorization: `Bearer ${access_token}` } };

        let userResponse;
        try {
          userResponse = await axios.get(env.ONEID_API_ACCOUNT_COLLAB, header);
        } catch (error) {
          LoggetUtils.error(
            `Failed to request get account ONEID ${env.ONEID_API_ACCOUNT_COLLAB}`
          );
          throw new ExternalErrorException(
            "Failed to request get account ONEID"
          );
        }

        if ("data" in userResponse) {
          const oneBoxData = await OneBoxUtils.getOneBox(
            access_token,
            account_id
          );

          const userInfo = userResponse.data;
          const email = userInfo.email[0].email;
          let firstname = userInfo.first_name_eng ?? userInfo.first_name_th;
          let lastname = userInfo.last_name_eng ?? userInfo.last_name_th;

          firstname = firstname ?? userInfo.email[0].email.split("@")[0];
          lastname = lastname ?? lastname;

          const phonenumber = userInfo.mobile[0].mobile_no;
          const user = await this.getUser(username, email, account_id);

          if (!user) {
            const isUserDeleted = await this.checkUserDelete(account_id);
            const roleDGA = await checkRoleDGA(
              userInfo.email[0].email,
              oneBoxData.company,
              isUserDeleted
            );

            const userData = {
              username:
                username == ""
                  ? HashUtils.encode(email.split("@")[0])
                  : HashUtils.encode(username),
              name:
                firstname == null
                  ? HashUtils.encode(email.split("@")[0])
                  : HashUtils.encode(firstname),
              lastname:
                lastname == null
                  ? HashUtils.encode(email.split("@")[0])
                  : HashUtils.encode(lastname),
              phonenumber: HashUtils.encode(phonenumber),
              company: HashUtils.encode(dataOnebox.company),

              oneid: account_id,
              room_id: "",
              role: roleDGA,
              avatar_profile: `${env.DOMAIN}/image/profile/userdefault.png`,
              verifyemail: true,
              license:
                (await Roles.findOne({ _id: roleDGA }, "name").name) ==
                "citizen"
                  ? Date.now()
                  : null,
            };
            const user = new User(userData);

            const roomData = {
              user_id: user._id,
              name: "Meeting_Room",
              uid: await RoomService.getRoomUid(user.name),
              key: HashUtils.encode("123roominet!"),
              setting: {
                SecretRoom: false,
                OneboxAccountid: oneBoxData.account_id,
                ApproveUserJoin: true,
                MuteAll: false,
                TypeOTP: "sms",
              },
            };
            const room = new Rooms(roomData);

            user.room_id = room._id;
            await Promise.all(user.save(), room.save());

            const newUser = new UserDTO(user);
            const newRoom = new RoomDTO(room);

            return {
              status: login.data.result,
              user: newUser,
              room: newRoom,
              access_token: access_token,
              refresh_token: refresh_token,
            };
          }
        }
      }

      return { status: "error" };
    } catch (error) {
      return { status: "error", message: error.response.data };
    }
  }

  async loginCollab(email, password) {
    const data = {
      client_id: env.ONEID_CLIENT_ID_COLLAB,
      client_secret: env.ONEID_CLIENT_SECRET_COLLAB,
      refcode: env.ONEID_REF_CODE_COLLAB,
      onecorporationmail: email,
    };

    let loginResponse;
    try {
      loginResponse = await axios.post(env.COLLAB_API_LOGIN, data);
    } catch (error) {
      LoggerUtils.error(
        `Failed to request for login to ${env.COLLAB_API_LOGIN}`
      );
      throw new ExternalErrorException("Failed to request collab login");
    }
    const status = loginResponse.data.result;
    const loginData = loginResponse.data;

    if (status !== "Success")
      return { status: "error", message: "Failed to create collab ONE ID" };

    const username = loginData.username ?? "";
    const account_id = loginData.account_id;
    const access_token = loginData.access_token;
    const refresh_token = loginData.refresh_token;

    const header = { headers: { Authorization: `Bearer ${access_token}` } };

    let userResponse;
    try {
      userResponse = await axios.get(env.ONEID_API_ACCOUNT_COLLAB, header);
    } catch (error) {
      LoggerUtils.error(
        `Failed to request for login to ${env.ONEID_API_ACCOUNT_COLLAB}`
      );
      throw new Error("Failed to request collab login");
    }

    if ("data" in getUser) {
      const dataOnebox = await onebox.getonebox(access_token, account_id);
      const userData = userResponse.data;
      const email = userData.email[0].email;
      var firstname = userData.first_name_eng ?? userData.first_name_th;
      var lastname = userData.last_name_eng ?? userData.last_name_th;
      const phonenumber = userData.mobile[0].mobile_no;

      firstname = firstname ?? userData.email[0].email.split("@")[0];
      lastname = lastname == null ? "" : lastname;

      let user = await this.getUser(username, email, account_id);

      if (user) {
        if (user.verifyemail == false) {
          return { status: "errorverification" };
        } else {
          const userCurrent = await this.findAndUpdateUser({
            username,
            account_id,
            email,
            firstname,
            lastname,
          });
          let room = await Rooms.findOne(
            { user_id: userCurrent._id },
            {
              created_at: 0,
              updated_at: 0,
              last_session: 0,
              __v: 0,
            }
          );

          const isTypeOTP = Object.keys(room.setting).includes("TypeOTP");
          if (!isTypeOTP) {
            let option = {
              ...room.setting,
              TypeOTP: "sms",
            };
            room.setting = option;
            await room.save();
          }

          return {
            status: login.data.result,
            user: userCurrent,
            room: room,
            access_token: access_token,
            refresh_token: refresh_token,
          };
        }
      } else {
        const UserDelete = await this.checkUserDelete(account_id);
        const userRole = await this.checkRoleDGA(
          userData.email[0].email,
          dataOnebox.company,
          UserDelete
        );

        let user = new Users({
          username:
            username == ""
              ? HashUtils.encode(email.split("@")[0])
              : HashUtils.encode(username),
          email: HashUtils.encode(email),
          name:
            firstname == null
              ? HashUtils.encode(email.split("@")[0])
              : HashUtils.encode(firstname),
          lastname:
            lastname == null
              ? HashUtils.encode(email.split("@")[0])
              : HashUtils.encode(lastname),
          phonenumber: HashUtils.encode(phonenumber),
          company: HashUtils.encode(dataOnebox.company),

          oneid: account_id,
          room_id: "",
          role: userRole,
          avatar_profile: `${env.DOMAIN}/image/profile/userdefault.png`,
          verifyemail: true,
          license:
            (await Roles.findOne({ _id: userRole }, "name").name) == "citizen"
              ? Date.now()
              : null,
        });
        let room = new Rooms({
          user_id: user._id,
          name: "Meeting_Room",
          uid: await RoomService.getRoomUid(user),
          key: HashUtils.encode("123roominet!"),
          setting: {
            SecretRoom: false,
            OneboxAccountid: dataOnebox.account_id,
            ApproveUserJoin: true,
            MuteAll: false,
            TypeOTP: "sms",
          },
        });
        user.room_id = room._id;

        try {
          await Promise.all(user.save(), room.save());
        } catch (error) {
          throw ExternalErrorException("Failed to create new user and room");
        }

        let newUser = new UserDTO(user);
        let newRoom = new RoomDTO(room);

        return {
          status: login.data.result,
          user: newUser,
          room: newRoom,
          access_token: access_token,
          refresh_token: refresh_token,
        };
      }
    }
  }

  async checkUserDelete(account_id) {
    const check = await DeleteUser.findOne({ oneid: account_id }, { oneid: 1 });
    if (check) return true;
    return false;
  }

  async checkRoleDGA(email, checkrole, UserDelete) {
    let role;

    if (UserDelete) {
      try {
        role = await Roles.findOne({ name: "citizen" }, "_id");
        LoggerUtils.info(
          `email: ${email}, role: citizen, id: ${role._id}, message: This user has been deleted before.`
        );
        return role._id;
      } catch (error) {
        throw ExternalErrorException("Failed to get role");
      }
    }

    try {
      role = await Roles.findOne({ name: "host" }, "_id");
      LoggerUtils.info(
        `email: ${email}, role: bussiness, id: ${role._id}, message: First login`
      );
      return role._id;
    } catch (error) {
      throw ExternalErrorException("Failed to get role");
    }
  }

  async updateUserOneId(
    username,
    account_id,
    firstname,
    lastname,
    phonenumber
  ) {
    try {
      await await Users.findOneAndUpdate(
        {
          $or: [
            { username: username },
            { email: HashUtils.encode(email) },
            { oneid: account_id },
          ],
        },
        {
          $set: {
            username:
              username == ""
                ? HashUtils.encode(email.split("@")[0])
                : HashUtils.encode(username),
            email: encode(email),
            oneid: account_id,
            name:
              firstname == null
                ? HashUtils.encode(email.split("@")[0])
                : HashUtils.encode(firstname),
            lastname:
              lastname == null
                ? HashUtils.encode(email.split("@")[0])
                : HashUtils.encode(lastname),

            phonenumber: HashUtils.encode(phonenumber),
            updated_at: Date.now(),
          },
        },
        {
          fields: {
            verifyemail: 0,
            license: 0,
            limit: 0,
            updated_at: 0,
            created_at: 0,
            last_session: 0,
            __v: 0,
          },
          new: true,
        }
      );
      await Rooms.findOne(
        { user_id: userCurrent._id },
        {
          created_at: 0,
          updated_at: 0,
          last_session: 0,
          __v: 0,
        }
      );
    } catch (error) {
      throw new ExternalErrorException("Failed to update user and room");
    }
  }

  async getUser(username, email, account_id) {
    let user;
    try {
      user = await Users.findOne(
        {
          $or: [
            { username: username },
            { email: HashUtils.encode(email) },
            { oneid: account_id },
          ],
        },
        "verifyemail"
      );
    } catch (error) {
      throw ExternalErrorException("Failed to get user information");
    }

    return user;
  }

  async loginOneId(username, password) {
    const data = {
      grant_type: "password",
      client_id: env.ONEID_CLIENT_ID,
      client_secret: env.ONEID_CLIENT_SECRET,
      username,
      password,
    };

    let response;
    try {
      response = await axios.post(env.ONEID_API_LOGIN, data);
    } catch (error) {
      LoggerUtils.error(
        `Authorization. username or password could not be found.`
      );
      throw new AuthorizationException("Authorization ");
    }

    if (response.data.result !== "Success") return { status: "error" };

    const userInfo = {
      username: response.data.username,
      account_id: response.data.account_id,
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
    };

    const header = {
      headers: { Authorization: `Bearer ${userInfo.access_token}` },
    };

    let userAccountResponse;
    try {
      userAccountResponse = await axios.get(env.ONEID_API_ACCOUNT, header);
    } catch (error) {
      LoggerUtils.error("Failed to get user account.");
      throw new AuthorizationException("Unauthorized Failed");
    }

    const userData = userAccountResponse.data;
    const email = userData.email[0].email;

    let firstname = userData.first_name_eng ?? userData.first_name_th;
    let lastname = userData.last_name_eng ?? userData.last_name_th;

    firstname = firstname ?? userData.email[0].email.split("@")[0];
    lastname = lastname ?? "";

    const phoneNumber = userData.mobile[0].mobile_no;

    let user;
    try {
      user = await User.findOne({ oneid: userData.account_id }, "verifyemail");
    } catch (error) {
      throw ExternalErrorException("Failed to get user information");
    }

    if (!user) {
      let oneBoxData;
      try {
        oneBoxData = await OneBoxUtils.getOneBox(
          userInfo.access_token,
          userInfo.account_id
        );
      } catch (error) {
        throw new AuthorizationException(
          "Failed to retrieve Onebox information, Invalid token"
        );
      }

      let UserDelete;
      let userRoleId;
      try {
        UserDelete = await this.isUserDeleted(userData.account_id);
        userRoleId = await this.getRoleId(
          userData.email[0].email,
          oneBoxData.company,
          UserDelete
        );
      } catch (error) {
        throw new ExternalErrorException(
          "Failed to find that user has been deleted and cannot get the user role"
        );
      }

      const userRoleInDb = await Roles.findOne({ _id: userRoleId }, "name");

      const user = new User({
        username: HashUtils.encode(username),
        email: HashUtils.encode(email),
        name:
          firstname == null
            ? HashUtils.encode(email.split("@")[0])
            : HashUtils.encode(firstname),
        lastname:
          lastname == null
            ? HashUtils.encode(email.split("@")[0])
            : HashUtils.encode(lastname),
        phonenumber: HashUtils.encode(phoneNumber),
        company: HashUtils.encode(oneBoxData.company),
        oneid: userData.account_id,
        room_id: "",
        role: userRoleId,
        avatar_profile: `${env.DOMAIN}/image/profile/userdefault.png`,
        verifyemail: true,
        license: userRoleInDb === "citizen" ? Date.now() : null,
      });

      const room = new Rooms({
        user_id: user._id,
        name: "Meeting_Room",
        uid: await RoomService.getRoomUid(user),
        key: HashUtils.encode("123roominet!"),
        vender: "jitsi",
        setting: {
          SecretRoom: false,
          OneboxAccountid: oneBoxData.account_id,
          ApproveUserJoin: true,
          MuteAll: false,
          TypeOTP: "sms",
        },
      });

      user.room_id = room._id;

      await Promise.all([user.save(), room.save()]);

      const newUser = new UserDTO({
        ...user,
        username: user.username,
        name: user.name,
        lastname: user.lastname,
        email: user.email,
        phonenumber: phonenumber,
        company: dataOnebox.company,
      });

      const newRoom = new RoomDTO({
        ...room,
      });

      return {
        status: login.data.result,
        user: newUser,
        room: newRoom,
        access_token: access_token,
        refresh_token: refresh_token,
      };
    }

    if (user.verifyemail == false) {
      return { status: "errorverification" };
    }

    try {
      const userBody = {
        account_id: response.data.account_id,
        username: response.data.username,
        email: userAccountResponse.data.email[0].email,
        firstname: firstname,
        lastname: lastname,
      };

      let userCurrent = await this.findAndUpdateUser(userBody);

      const room = await Rooms.findOne({ user_id: userCurrent._id });

      let newCurrent = userCurrent.toObject();
      newCurrent.username = userCurrent.username;
      newCurrent.name = userCurrent.name;
      newCurrent.lastname = userCurrent.lastname;
      newCurrent.email = userCurrent.email;
      newCurrent.phonenumber = HashUtils.decode(userCurrent.phonenumber);
      return {
        status: response.data.result,
        user: newCurrent,
        room: room,
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };
    } catch (error) {
      console.log(error);
      return { status: "error" };
    }
  }

  async findAndUpdateUser(body) {
    const updateData = await User.findOneAndUpdate(
      { oneid: body.account_id },
      {
        $set: {
          username: HashUtils.encode(body.username),
          email: HashUtils.encode(body.email),
          oneid: body.account_id,
          name:
            body.firstname == null
              ? HashUtils.encode(body.email.split("@")[0])
              : HashUtils.encode(body.firstname),
          lastname:
            body.lastname == null
              ? HashUtils.encode(body.email.split("@")[0])
              : HashUtils.encode(body.lastname),
          updated_at: Date.now(),
        },
      },
      {
        fields: {
          verifyemail: 0,
          license: 0,
          limit: 0,
          updated_at: 0,
          created_at: 0,
          last_session: 0,
          __v: 0,
        },
        new: true,
      }
    );

    return updateData;
  }

  async isUserDeleted(account_id) {
    const deleteUser = await DeleteUser.findOne(
      { oneid: account_id },
      { oneid: 1 }
    );
    if (deleteUser) return true;
    return false;
  }

  async getRoleId(email, checkrole, UserDelete) {
    let role;

    if (!UserDelete) {
      if (checkrole !== "ผู้ใช้ทั่วไป") {
        role = await Roles.findOne({ name: "host" }, "_id");
        LoggerUtils.info(
          `email: ${email}, role: bussiness, id: ${role._id}, message: First login`
        );
        return role._id;
      }
      role = await Roles.findOne({ name: "citizen" }, "_id");
      LoggerUtils.info(
        `email: ${email}, role: citizen, id: ${role._id}, message: First login`
      );
      return role._id;
    }

    role = await Roles.findOne({ name: "citizen" }, "_id");
    LoggerUtils.info(
      `email: ${email}, role: citizen, id: ${role._id}, message: This user has been deleted before.`
    );
    return role._id;
  }

  async sharedToken(token) {
    const data = {
      client_id: env.ONEID_CLIENT_ID,
      client_secret: env.ONEID_CLIENT_SECRET,
      refcode: env.ONEID_REF_CODE,
      shared_token: token,
    };

    let response;
    try {
      response = await axios.post(env.ONEID_API_SHARETOKEN, data);
    } catch (error) {
      LoggerUtils.error(
        `Failed to request for create shared token at ${env.ONEID_API_SHARETOKEN}`
      );
      throw ValidationException("Invalid token");
    }

    const status = response.data.result;

    if (status !== "Success") return { status: "error" };

    const username = getUserbysharedtoken.data.username;
    const account_id = getUserbysharedtoken.data.account_id;
    const access_token = getUserbysharedtoken.data.access_token;
    const refresh_token = getUserbysharedtoken.data.refresh_token;

    const header = { headers: { Authorization: `Bearer ${access_token}` } };

    let userResponse;
    try {
      userResponse = await axios.get(env.ONEID_API_ACCOUNT, header);
    } catch (error) {
      LoggerUtils.error(
        `Failed to request for get api user account at ${env.ONEID_API_ACCOUNT}`
      );
      throw ValidationException("Invalid token");
    }

    if ("data" in userResponse) {
      const data = userResponse.data;
      const OneboxData = await OneBoxUtils.getOneBox(access_token, account_id);
      const userData = data;
      const email = data.email[0].email;

      const firstname = data.first_name_eng ?? data.first_name_th;
      const lastname = data.last_name_eng ?? data.last_name_th;
      firstname = firstname ?? data.email[0].email.split("@")[0];
      lastname = lastname ?? "";

      const phonenumber = data.mobile[0].mobile_no;

      let user;
      try {
        user = await Users.findOne(
          {
            oneid: account_id,
          },
          "verifyemail"
        );
      } catch (error) {
        LoggerUtils.error("Failed to retrieve user data from database");
        throw ExternalErrorException("Failed to get user info");
      }

      if (!user) {
        const UserDelete = await this.checkUserDelete(account_id);
        const getRole = await this.checkRoleDGA(
          userData.email[0].email,
          OneboxData.company,
          UserDelete
        );

        const newUserData = {
          username:
            username == null
              ? HashUtils.encode(email.split("@")[0])
              : HashUtils.encode(username),
          email: HashUtils.encode(email),
          name:
            firstname == null
              ? HashUtils.encode(email.split("@")[0])
              : HashUtils.encode(firstname),
          lastname:
            lastname == null
              ? HashUtils.encode(email.split("@")[0])
              : HashUtils.encode(lastname),
          phonenumber: HashUtils.encode(phonenumber),
          company: HashUtils.encode(dataOnebox.company),
          oneid: account_id,
          room_id: "",
          role: getRole,
          avatar_profile: `${env.DOMAIN}/image/profile/userdefault.png`,
          verifyemail: true,
          license:
            (await Roles.findOne({ _id: getRole }, "name").name) == "citizen"
              ? Date.now()
              : null,
        };
        let user = new User(newUserData);

        const newRoomData = {
          user_id: user._id,
          name: "Meeting_Room",
          uid: await RoomService.getRoomUid(user.name),
          key: HashUtils.encode("123roominet!"),
          setting: {
            SecretRoom: false,
            OneboxAccountid: OneboxData.account_id,
            ApproveUserJoin: true,
            MuteAll: false,
            TypeOTP: "sms",
          },
        };
        let room = new Rooms(newRoomData);

        user.room_id = room._id;

        try {
          await Promise.all([user.save(), room.save()]);
        } catch (error) {
          LoggerUtils.error(`Failed to create new user and room from One Id`);
          throw new ExternalErrorException(
            "Failed to create new user with room."
          );
        }

        const newUser = new UserDTO(user);
        const newRoom = new RoomDTO(room);

        return {
          status: response.data.result,
          user: newUser,
          room: newRoom,
          access_token: access_token,
          refresh_token: refresh_token,
        };
      }

      if (user.verifyemail == false) return { status: "errorverification" };

      let userCurrent = await User.findOneAndUpdate(
        {
          $or: [{ email: HashUtils.encode(email) }, { oneid: account_id }],
        },
        {
          $set: {
            username:
              username == null
                ? HashUtils.encode(email.split("@")[0])
                : HashUtils.encode(username),
            email: HashUtils.encode(email),
            oneid: account_id,
            name:
              firstname == null
                ? HashUtils.encode(email.split("@")[0])
                : HashUtils.encode(firstname),
            lastname:
              lastname == null
                ? HashUtils.encode(email.split("@")[0])
                : HashUtils.encode(lastname),
            updated_at: Date.now(),
          },
        },
        {
          fields: {
            verifyemail: 0,
            license: 0,
            limit: 0,
            updated_at: 0,
            created_at: 0,
            last_session: 0,
            __v: 0,
          },
          new: true,
        }
      );
      let room = await Rooms.findOneAndUpdate(
        { user_id: userCurrent._id },
        {
          $set: {
            "setting.OneboxAccountid": OneboxData.account_id,
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

      let isTypeOTP = Object.keys(room.setting).includes("TypeOTP");

      if (!isTypeOTP) {
        let option = {
          ...room.setting,
          TypeOTP: "sms",
        };
        room.setting = option;
        await room.save();
      }

      let newCurrent = userCurrent.toObject();
      newCurrent.username = userCurrent.username;
      newCurrent.name = userCurrent.name;
      newCurrent.lastname = userCurrent.lastname;
      newCurrent.email = userCurrent.email;
      newCurrent.oneid = userCurrent.oneid;
      newCurrent.phonenumber = userCurrent.phonenumber;

      return {
        status: response.data.result,
        user: newCurrent,
        room: room,
        access_token: access_token,
        refresh_token: refresh_token,
      };
    }
  }
}

module.exports = new OneIdUtils();
