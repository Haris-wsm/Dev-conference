cosnt = { createLogger, transports, format } = require("winston");
const path = require("path");

const DateUtils = require("../utils/DateUtils");
const loggerDir = path.resolve(".", "log", `${DateUtils.getDate()}-app.log`);

const customFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    return `${info.timestamp} [${info.level
      .toUpperCase()
      .padEnd(7)}] :[ ${DateUtils.getLoggerTimestap()} ] ${info.message}`;
  })
);

const destination = [
  new transports.Console(),
  new transports.File({ filename: loggerDir }),
];

const logger = createLogger({
  transports: destination,
  level: "debug",
  format: customFormat,
  silent: process.env.NODE_ENV === "test" || process.env.NODE_ENV === "staging",
});

module.exports = logger;
