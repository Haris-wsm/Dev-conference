const OneBoxService = require("./services");

class OneBoxController {
  async download(req, res, next) {
    try {
      const data = await OneBoxService.download(
        req.authData,
        req.params.file_id
      );
      res.setHeader("Content-Type", data.mimetype);
      res.setHeader(
        "Content-disposition",
        `attachment; filename=${data.filename}`
      );

      res.send({ data: data.json });
    } catch (error) {
      next(error);
    }
  }
  async saveOnebox(req, res, next) {
    try {
      const data = await OneBoxService.saveOnebox(req.params.meetingid);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async getOneboxBusiness(req, res, next) {
    try {
      const data = await OneBoxService.getOneboxBusiness(req.authData);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
  async getOneboxFile(req, res, next) {
    try {
      const meetingId = req.params.meetingid;

      const data = await OneBoxService.getOneboxFile(meetingId, req.authData);
      res.send(data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OneBoxController();
