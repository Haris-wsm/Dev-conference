module.exports = function ForbiddenException(message) {
  this.status = "error";
  this.code = 403;
  this.message = message;
};
