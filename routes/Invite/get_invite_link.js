var dbconnect = require('./../../dbconnect');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');
const randomstring =  require("randomstring");
const Settings = require('../../utils/Settings');

module.exports = function (req,res){
    const user = req.body.user;
    dbconnect.get_referral_code(user.id,function(error, results ){
        if (error) {
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
                if(results[0].referral_code){
                    const referral = {
                        "referral_code":results[0].referral_code,
                        "android_url":Settings.get_android_url(results[0].referral_code),
                        "ios_url":Settings.get_ios_url(results[0].referral_code)
                    }
                    res.status(HttpStatus.OK).json(referral)
                }else{
                    const referral_code= randomstring.generate(10);
                    dbconnect.add_referral_for_user(user.id,referral_code ,function(error, results ){
                        if (error) {
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
                        }else{
                            const referral = {
                                "refferal_code":referral_code,
                                "android_url":Settings.get_android_url(referral_code),
                                "ios_url":Settings.get_ios_url(referral_code)
                            }
                            res.status(HttpStatus.OK).json(referral)
                        }
                    })
                }
            }else{
                var error_key = "get_invite_link_"+Date.now();
                logger.log({
                    level: 'error',
                    time_stamp: Date.now(),
                    message: "Not valid user",
                    error_key: error_key
                });
                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                    "code": HttpStatus.INTERNAL_SERVER_ERROR,
                    "message": "Not valid user, please try to login again",
                    "error_key": error_key
                })
            }
        }
  });
}