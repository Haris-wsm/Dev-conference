// environment variables
const env = require("../index");
const mongoose = require("mongoose");

// * Models
const Roles = require("../../model/role");

class Database {
  async connect() {
    try {
      let url;
      if (env.databaseHost.includes(",")) {
        //replica set
        const dbHost = env.databaseHost.split(",");
        const password = encodeURIComponent(env.database_Password);
        const port = env.databasePort_ie;
        url = `mongodb://${env.database_User}:${password}@${dbHost[0]}:${port},${dbHost[1]}:${port},${dbHost[2]}:${port}/${env.databaseName_ie}?replicaSet=${env.database_AuthSource}&authSource=${env.database_AuthSource}`;
      } else
        url = `mongodb://${env.databaseHost}:${env.databasePort_ie}/${env.databaseName_ie}?authSource=${env.database_AuthSource}`;

      console.log(url);
      // * This below option in mongodb version 6 is no longer supported
      // const option = {
      //   user: env.database_User,
      //   pass: env.database_Password,
      //   useNewUrlParser: true,
      //   useUnifiedTopology: true,
      //   useCreateIndex: true,
      //   useFindAndModify: false,
      // };

      const option = {
        user: env.database_User,
        pass: env.database_Password,
      };

      mongoose.connect(url, option);
      mongoose.connection.on("connected", function () {
        console.log("DB Connection");
      });
      mongoose.connection.on("error", function (err) {
        console.log("DB Connection error: " + err);
      });

      this.createRole();
      // console.log('DB Connect');
    } catch (error) {
      console.log(error);
    }
  }

  async createRole() {
    try {
      let roleInDB = await Roles.find({
        $or: [
          { name: "admin" },
          { name: "user" },
          { name: "host" },
          { name: "citizen" },
        ],
      });

      if (!roleInDB.length) {
        const roles = ["admin", "user", "host", "citizen"];

        const roleQueries = roles.map((role) =>
          new Roles({
            name: role,
            created_at: Date.now(),
            updated_at: Date.now(),
          }).save()
        );

        /*
         * * Run all queries in pararell for reduce times consumption instead of
         * * calling each callback in sequential order
         */
        await Promise.all(roleQueries);
        console.log("Create Roles");
      }
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new Database();
