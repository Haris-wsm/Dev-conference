const RoleServices = require("./services");

class RoleControllers {
  async create(req, res, next) {
    try {
      const data = await RoleServices.create(req.body);
      res.send({
        status: "Success",
        messge: "Create Role Succes",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoleControllers();
