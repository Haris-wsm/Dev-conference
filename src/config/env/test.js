const path = require("path");

if (process.env.NODE_ENV === "test") {
  const pathEnvFile = path.join(__dirname, "../../.env.test");
  require("dotenv").config({ path: pathEnvFile });
}

const environments = require("./index");

module.exports = {
  ...environments,
};
