module.exports = ErrorHandler = (err, req, res, next) => {
  const { status, message, errors, data, code } = err;
  let validationErrors;
  //   if (errors) {
  //     validationErrors = {};

  //     errors.forEach((error) => {
  //       validationErrors[error.param] = req.t(error.msg);
  //     });
  //   }

  res.status(code || 500).send({
    status: status || "error",
    path: req.originalUrl,
    timestamp: new Date().getTime(),
    message: message,
    // ...data,
  });
};
