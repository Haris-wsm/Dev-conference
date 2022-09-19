// Models
const Rooms = require("../../model/room");
const HistoryRooms = require("../../model/historyRoom");
const SessonRooms = require("../../model/sessionRoom");
const Users = require("../../model/user");
const SessionUser = require("../../model/sessionUser");

const crypto = require("crypto");

// Utils
const HashUtils = require("../../utils/HashUtils");
const LoggerUtils = require("../../utils/LoggerUtils");

// Environments
const env = require("../../config/env");
const DateUtils = require("../../utils/DateUtils");
const TokenUtils = require("../../utils/TokenUtils");

// Library
const cron = require("node-cron");
const ExternalErrorException = require("../../error/ExternalErrorException");

class RoomService {
  async getRoomUid(user) {
    const uid = this.createUID(user.name);

    const data = await Rooms.findOne({ uid });
    return data ? getRoomUid() : uid;
  }

  createUID(data) {
    const hash = `${HashUtils.decode(data).substr(0, 3)}-${crypto
      .randomBytes(4)
      .toString("hex")}-${crypto.randomBytes(4).toString("hex")}`;

    return hash;
  }

  async createPexipRoom(token) {
    const header = { headers: { Authorization: `Basic ${env.TOKEN_PEXIP}=` } };

    const roomUID = token.room.uid;
    const queries = [
      Rooms.findOne({ uid: roomUID }),
      HistoryRooms.findOne({ uid: roomUID }),
      SessonRooms.findOne({ uid: roomUID }),
    ];

    let room, history, sessionRoom;
    try {
      [room, history, sessionRoom] = await Promise.all(queries);
    } catch (error) {
      throw new ExternalErrorException(
        "Failed to retrieve data for pexip room"
      );
    }

    const time = DateUtils.getDateToRoom();
    const questPin = DateUtils.getRandomNumber();
    const hostPin = DateUtils.getRandomNumber();

    const data = {
      name: `${token.room.name}_${time}`,
      service_type: "conference",
      aliases: [
        { alias: `${token.room.name}_${time}alias1` },
        { alias: `${token.room.name}_${time}alias2` },
      ],
      pin: hostPin,
      guest_pin: questPin,
      allow_guests: true,
      primary_owner_email_address: HashUtils.decode(token.user.email),
      mute_all_guests: true,
    };

    const newOption = {
      SerectRoom: room.setting.SecrretRoom,
      OneboxAccountid: room.setting.OneboxAccountid,
      ApproveUserJoin: room.setting.ApproveUserJoin,
      MuteAll: room.setting.MuteAll,
      Login: room.setting.Login,
      pexip: data,
    };

    room.setting = newOption;
    history.setting = newOption;
    sessionRoom.setting = newOption;

    try {
      await Promise.all(room.save(), history.save(), sessionRoom.save());
    } catch (error) {
      console.log(error);
      throw new ExternalErrorException(
        'Failed to save data for "room" and "history'
      );
    }

    data.pin = `${data.pin}#`;
    data.guest_pin = `${data.guest_pin}#`;

    let responseCreatePexip;
    try {
      responseCreatePexip = await axios.post(
        env.pexip_create_room,
        data,
        header
      );
    } catch (error) {
      throw new console.log(error);
    }

    return data;
  }

  async logoutPexipRoom(token) {
    try {
      const deleteQueries = [
        Sessionroom.deleteOne({ uid: authData.room.uid }),
        Rooms.deleteOne({ uid: authData.room.uid }),
      ];

      await Promise.all(deleteQueries);

      const user = await Users.findOne({ oneid: authData.user.oneid });
      const room = new Rooms({
        user_id: authData.user._id,
        name: "Meeting_Room",
        uid: await this.getRoomUid(authData.user.name),
        key: HashUtils.encode("123roominet!"),
        vender: "jitsi",
        setting: {
          SecretRoom: false,
          OneboxAccountid: authData.user.oneid,
          ApproveUserJoin: true,
          MuteAll: false,
          TypeOTP: "sms",
        },
      });

      user.room_id = room._id;
      await Promise.all([user.save(), room.save()]);

      const service = { service: "oneid" };
      const signToken = await TokenUtils.sign({ user, room, service });
      const encodeSignToken = HashUtils.encodeJS(signToken);

      let sessionuser = await SessionUser.findOne({
        email: token.user.email,
      });
      sessionuser.token = encodeSignToken;

      sessionuser.token = encodeSignToken;
      await sessionuser.save();
    } catch (error) {
      console.log(error);
    }
  }

  async createSession(body, token, headers) {
    const { voice, video } = body;
    let role = await Roles.findOne({ _id: authData.user.role }, "name");
    let sessionUserData = await SessionUser.aggregate([
      {
        $lookup: {
          // join
          from: "Users",
          localField: "email",
          foreignField: "email",
          as: "user_result",
        },
      },
      { $match: { email: token.user.email } }, //where
      {
        $project: {
          // select
          email: 1,
          access_token: 1,
          user_result: { limit: 1, license: 1 },
        },
      },
    ]);

    if (!sessionUserData.length)
      throw new AuthorizationException("No sessionuser");
    if (sessionuserData.length) {
      // const access_token = sessionuser[0].access_token;
      // const getLOVlevel = await checkStartMeeting(access_token);
      // if (getLOVlevel.status === "success") {
      var checkLimit = sessionUserData[0].user_result[0];
      let checksession = await SessonRooms.findOne(
        { user_id: token.user._id },
        "_id"
      );

      let myip = headers["x-forwarded-for"];

      if (checksession) {
        return {
          status: "error",
          message:
            "The chat room has started, Wait until the meeting is finished.",
        };
      }

      if (role.name === "citizen") {
        if (checkLimit.limit >= parseInt(env.limitstartmeeting)) {
          await SessionRooms.deleteOne({ user_id: token.user._id });
          LoggerUtils.error(
            `email: ${token.user.email}, username: ${token.user.username}, message: Your account is correct Limited to use this month..`
          );

          throw new ForbiddenException(
            "Your account is correct Limited to use this month."
          );
        }

        if (checkLimit.limit > 0) {
          checkLimit.limit += 1;
          await Users.updateOne({ _id: authData.user._id }, [
            { $set: { limit: checkLimit.limit } },
          ]);
          await this.createSession(authData, role.name);
        }

        if (checkLimit.limit === 0) {
          if (checkLimit.license === null) {
            checkLimit.license = new Date();
            await Users.updateOne({ _id: token.user._id }, [
              { $set: { license: checkLimit.license } },
            ]);
          }
          cron.schedule(
            date_time.nextmonth(checkLimit.license),
            async function () {
              // reset limit start meeting when Complete 30 day.
              LoggerUtils.info(
                `email: ${token.user.email}, username: ${token.user.username}, role: ${role.name}, message: limit meeting clear.`
              );
              await Users.updateOne({ _id: token.user._id }, [
                { $set: { limit: 0, license: new Date() } },
              ]);
            }
          );
          checkLimit.limit += 1;
          await Users.updateOne({ _id: token.user._id }, [
            { $set: { limit: checkLimit.limit } },
          ]);
          await createSession(authData, role.name);
        }
      } else {
        var genCodeJoin = crypto.randomBytes(10).toString("hex");
        await createSession(token, role.name, genCodeJoin);
      }

      async function createSession(authData, role, genCodeJoin) {
        let session_room = new Sessionroom({
          user_id: authData.user._id,
          room_id: authData.room._id,
          uid: authData.room.uid,
          code: genCodeJoin,
          roomname: authData.room.name,
          name: authData.user.name,
          username: authData.user.username,
          vender: authData.room.vender,
          meeting_id: `${md5(
            authData.room.uid + authData.user.user_id
          )}-${Date.now()}`,
          option: checkOptionLobby(voice, video),
          key: authData.room.key,
          setting: authData.room.setting,
          member: [
            {
              email: authData.user.email,
              join_at: [Date.now()],
              out_at: [],
              id: authData.user._id,
              ip: [myip],
            },
          ],
          urlInvite: "",
          created_at: Date.now(),
          updated_at: Date.now(),
        });

        let historyRoom = new Historyroom({
          user_id: session_room.user_id,
          meeting_id: session_room.meeting_id,
          name: session_room.roomname,
          username: session_room.username,
          uid: session_room.uid,
          date: DateUtils.getDateWithStart(session_room.created_at),
          start_time: DateUtils.getTime(session_room.created_at),
          end_time: "",
          vender: session_room.vender,
          setting: authData.room.setting,
          member: [
            {
              email: authData.user.email,
              join_at: [session_room.created_at],
              out_at: [],
              id: authData.user._id,
              ip: [myip],
            },
          ],
          ip: myip,
          created_at: session_room.created_at,
          updated_at: session_room.created_at,
        });
        session_room.urlInvite = `${env.domain_frontend}/join/?uuid=${session_room.uid}`;
        let votes = await Votes.findOne({
          host_id: authData.user._id,
          meetingid: "",
        });
        if (votes) {
          votes.roomname = session_room.roomname;
          votes.meetingid = session_room.meeting_id;
          await votes.save();
        }
        await historyRoom.save();
        await session_room.save();

        // TODO: Create this function
        return sendcreateURL(session_room, role, voice, video, myip, token);
      }
    }
  }

  checkOptionLobby(voice, video) {
    let option;
    voice === true && video === true
      ? (option = { audio: true, video: true })
      : voice === true && video === false
      ? (option = { audio: true, video: false })
      : voice === false && video === true
      ? (option = { audio: false, video: true })
      : (option = { audio: false, video: false });
    return option;
  }

  sendcreateURL(session_room, role, voice, video, myip, authData) {
    const urlroomToken = {
      role: "moderator",
      meetingId: session_room.meeting_id,
      roomname: session_room.roomname,
      keyroom: session_room.key,
      nickname: HashUtils.decode(session_room.name),
      option: this.checkOptionLobby(voice, video),
      clientid: session_room.user_id + "-" + role,
      userXmpAuth: env.user_jitsi,
      passXmpAuth: env.password_jitsi,
      secretRoom: session_room.setting.SecretRoom,
      redirect: env.domain_frontend,
    };
    const token = HashUtils.encodeJS(urlroomToken);
    //  destroy session room in 24 hr
    cron.schedule(DateUtils.getSessionTimeout(), async function () {
      await SessionRooms.findOneAndDelete({
        meeting_id: session_room.meeting_id,
      });
      logger.info(
        `email: ${authData.user.email}, username: ${authData.user.username}, meetingid: ${session_room.meeting_id}, option: {video:${session_room.option.video},voice:${session_room.option.audio}}, message: Session room time out.`
      );
    });
    logger.info(
      `email: ${authData.user.email}, username: ${authData.user.username}, meetingid: ${session_room.meeting_id}, option: {video:${session_room.option.video},voice:${session_room.option.audio}}, IP: ${myip}, message: Moderator start meeting room.`
    );
    let createUrl = `${env.domain_conference}${session_room.meeting_id}?${token}`;
    // console.log(createUrl);
    return {
      status: "success",
      message: `Moderator ${authData.user.email} Start meeting room.`,
      meetingid: session_room.meeting_id,
      url: createUrl,
    };
  }

  async checkUID() {}
  async saveHistoryNoAuth() {}
  async joinRoomNoAuth() {}

  async joinRoom() {}
  async saveHistory() {}
  async getUrlMeet() {}
  async scheduleMeeting() {}
  async updateSchedule() {}
}

module.exports = new RoomService();
