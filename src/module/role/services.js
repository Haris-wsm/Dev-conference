// Models
const Role = require("../../model/role");

class RoleServices {
  async create(body) {
    const roleBody = {
      name: body.name,
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    return await Role.create(roleBody);
  }
}

module.exports = new RoleServices();
