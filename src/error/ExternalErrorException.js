module.exports = function ExternalErrorException(message) {
  this.status = "error";
  this.code = 500;
  this.message = message;
};
