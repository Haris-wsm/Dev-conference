const path = require("path");

if (process.env.NODE_ENV === "development") {
  const pathEnvFile = path.join(__dirname, "../../.env.dev");
  require("dotenv").config({ path: pathEnvFile });
}
const environments = require("./index");

module.exports = {
  ...environments,
};
