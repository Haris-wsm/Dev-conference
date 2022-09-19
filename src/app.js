const express = require("express");
const Database = require("./config/database");

//* Routes
const userRoute = require("./module/user/routes");
const authRoute = require("./module/auth/routes");
const roleRoute = require("./module/role/routes");
const roomRoute = require("./module/room/routes");

//* Middlewares
const ErrorHandler = require("./error/errorHandler");

// Library
const cors = require("cors");

const app = express();

//* Connect Database
Database.connect();

app.use(cors());
app.use(express.json({}));

app.use("/backend/api/users", userRoute);
app.use("/backend/api/auth", authRoute);
app.use("/backend/api/role", roleRoute);
app.use("/backend/api/rooms", roomRoute);

app.use(ErrorHandler);

module.exports = app;
