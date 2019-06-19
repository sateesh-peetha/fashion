var dbconnect = require("./../dbconnect");
const HttpStatus = require("http-status-codes");

module.exports = function(req, res) {
  const { records_per_page, page } = req.query;
  const limit = records_per_page ? parseInt(records_per_page) : 300;
  const offset = page ? parseInt(page) : 0;
  const buyer_id = req.body.user.id;

  dbconnect.get_fav_list(buyer_id, limit, limit * offset, function(error, results) {
    if (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error
      });
    } else {
      res.status(HttpStatus.OK).json(results);
    }
  });
};
