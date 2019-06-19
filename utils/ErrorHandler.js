const HttpStatus = require("http-status-codes");

function handleError(name, error, res) {
  const error_key = `${name}_${Date.now()}`;
  logger.log({
    level: "error",
    time_stamp: Date.now(),
    message: error.message,
    error_key,
  });
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
    code: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "error ocurred",
    error_key,
  });
}

module.exports = {
  handleError
}
