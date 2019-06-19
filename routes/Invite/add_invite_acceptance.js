var dbconnect = require('./../../dbconnect');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
    const {referral_code, accetpance_ack} = req.body;
    dbconnect.get_user_all_info_referral_code(referral_code,function(error, results ){
        if (error) {
            var error_key = "add_invite_acceptance_"+Date.now();
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
            if(results.length>0){
                const invitee_id = req.body.user.id;
                const inviter_id = results[0].id;
                dbconnect.check_user_referral_status(invitee_id, inviter_id,function(error, friendRow ){
                    if (error) {
                        var error_key = "add_invite_acceptance_"+Date.now();
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
                        if(friendRow.length>0){
                            //friend already there
                            const message = {
                                "message": "You have already accepted !"
                            }
                            res.status(HttpStatus.OK).json(message)    
                        }else{
                            //Add new accetance 
                            dbconnect.add_referral_for_user_friend(invitee_id, inviter_id ,function(error, results ){
                                if (error) {
                                    var error_key = "add_invite_acceptance_"+Date.now();
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
                                    const message={
                                        "message":"Congratulations! your response added successfully."
                                    }
                                    res.status(HttpStatus.OK).json(message);
                                }
                            });
                        }
                    }
                });
            }else{
                var error_key = "add_invite_acceptance_"+Date.now();
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
    })
}