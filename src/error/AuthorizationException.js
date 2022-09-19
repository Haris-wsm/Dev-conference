module.exports = function AuthorizationException(message, data) {
  this.status = "error";
  this.code = 401;
  this.message = message;
  this.data = data;
};
