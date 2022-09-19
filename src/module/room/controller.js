// Services
const RoomService = require("./services");

class RoomController {
  async createPexipRoom(req, res, next) {
    try {
      const data = await RoomService.createPexipRoom(req.authData);
      res.send({ message: "Success", data });
    } catch (error) {
      next(error);
    }
  }

  async logoutPexip(req, res, next) {
    try {
      const data = await RoomService.logoutPexipRoom(req.authData);

      res.send({});
    } catch (error) {
      next(error);
    }
  }
  async createSession(req, res, next) {
    try {
      const data = await RoomService.createSession(req.body);
    } catch (error) {
      next(error);
    }
  }

  // async checkUID(req, res, next) {}
  // async saveHistoryNoAuth(req, res, next) {}
  // async joinRoomNoAuth(req, res, next) {}

  // async joinRoom(req, res, next) {}
  // async saveHistory(req, res, next) {}
  // async getUrlMeet(req, res, next) {}
  // async scheduleMeeting(req, res, next) {}
  // async updateSchedule(req, res, next) {}
}

module.exports = new RoomController();
