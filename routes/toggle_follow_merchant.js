var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
var token;
const HttpStatus = require('http-status-codes');

module.exports = function (req,res) {
  const user_id = req.body.user.id;
  const follow_merchant = req.body.follow_merchant;
  const merchant_id = req.body.merchant_id;
  if (follow_merchant) {
    dbconnect.follow_merchant({ user_id: user_id, merchant_id: merchant_id }, function(error, result) {
      if (error) {
        var error_key = "follow_merchant_"+Date.now();
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
          successful: true
        })
      }
    })
  } else {
    dbconnect.unfollow_merchant({ user_id: user_id, merchant_id: merchant_id }, function(error, result) {
      if (error) {
        var error_key = "unfollow_merchant_"+Date.now();
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
          successful: true
        })
      }
    })
  }
}