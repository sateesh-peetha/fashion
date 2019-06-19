const dbConnect = require('./../dbconnect');
const jsonWebToken = require('jsonwebtoken');
const moment = require('moment');
var token = null;

exports.insertRankCountController = (req, res) => {
  var requestedData = {
    buyer_id: (req.body.buyer_id || req.query.buyer_id),
    rank_no: (req.body.rank_no || req.query.rank_no),
    merchant_id: (req.body.merchant_id || req.query.merchant_id),
    dt_created: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
  };
  dbConnect.insertRankCounts(requestedData, (error, info) => {
    if (error) {
      res.status(400).send({
        "status_code": 400,
        "message": "Bad Request."
      });
    } else {
      token = jsonWebToken.sign(requestedData, process.env.SECRET_KEY, {
        expiresIn: '1h'
      });
      res.status(200).send({
        "status_code": 200,
        "results": {
          "token": token,
          "data": requestedData
        }
      });
    }
  });
};