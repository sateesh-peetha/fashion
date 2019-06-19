var dbconnect = require('../../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
var token;
const HttpStatus = require('http-status-codes');
const moment = require("moment");

module.exports = function (req,res) {
  /**
  * Expected object:
  * {
  *   report_reason_id: 1,  
  *   merchant_id: 123
  *  }
  **/
  const user_id = req.body.user.id;
  const obj = {
    user_id: user_id,
    report_reason_id: req.body.report_reason_id,
    entity_id: req.body.merchant_id,
    entity_type: "merchant",
    reported_at: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
  }
  dbconnect.report_merchant(obj, function(error, info) {
    if (error) {
      var error_key = "report_merchant_"+Date.now();
      logger.log({
          level: 'error',
          time_stamp: Date.now(),
          message: error.message,
          error_key: error_key
      });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
          "code":HttpStatus.INTERNAL_SERVER_ERROR,
          "message":"error ocurred",
          "error_key": error_key
      })
    } else {
        res.json({
          success: true,
          message: "Merchant has been reported successfully"
        });
    }
  })
  
}