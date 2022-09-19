const path = require("path");

if (process.env.NODE_ENV === "production") {
  const pathEnvFile = path.join(__dirname, "../../.env.prod");
  require("dotenv").config({ path: pathEnvFile });
}

const environments = require("./index");

module.exports = {
  ...environments,
};
