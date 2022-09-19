module.exports = function ValidationException(message, data) {
  this.status = "error";
  this.code = 400;
  this.message = message;
  this.data = data;
};
