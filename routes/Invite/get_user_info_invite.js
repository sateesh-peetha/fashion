var dbconnect = require('./../../dbconnect');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
    const {referral_code} = req.query;
    dbconnect.get_user_info_referral_code(referral_code,function(error, results ){
        if (error) {
            console.log(error);
            var error_key = "get_invite_link_"+Date.now();
            logger.log({
                level: 'error',
                time_stamp: Date.now(),
                message: error.message,
                error_key: error_key
            });
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                "code": HttpStatus.INTERNAL_SERVER_ERROR,
                "message": "some error ocurred, please try again",
                "error_key": error_key
            })
        } else {
            if(results.length>0){
                res.status(HttpStatus.OK).json(results[0]);
            }else{
                var error_key = "get_invite_link_"+Date.now();
                logger.log({
                    level: 'error',
                    time_stamp: Date.now(),
                    message: "referral code : "+referral_code+" not available in databse",
                    error_key: error_key
                });
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    "code": HttpStatus.INTERNAL_SERVER_ERROR,
                    "message": "Sorry, Invalid referral code, please send valid referral code",
                    "error_key": error_key
                })
            }
        }
  });
}