const dbconnect = require('../../dbconnect');
const unirest = require('unirest');
const requestIp = require('request-ip');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){

    var phone_number = req.body.phone_number;
    var country_code = req.body.country_code;
    var verification_code = req.body.verification_code;

    unirest.get('https://api.authy.com/protected/json/phones/verification/check')
    .header('Content-Type', 'application/json')
    .header('X-Authy-API-Key', process.env.AUTHY_KEY)
    .send({ "verification_code": verification_code, "phone_number": phone_number, "country_code": country_code})
    .end(function (response) {
        if(response.body.success) {
            var user_object = {
                country_code: country_code,
                mobile: phone_number
            }
            dbconnect.create_user(user_object, function(err,insertInfo) {
                if (err) {
                    var error_key = "create_user_"+Date.now();
                    logger.log({
                        level: 'error',
                        time_stamp: Date.now(),
                        message: err.message,
                        error_key: error_key
                    });
                    res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                        "code":HttpStatus.INTERNAL_SERVER_ERROR,
                        "message":"error ocurred",
                        "error_key": error_key
                    })
                } else {
                    if (insertInfo["insertId"]) {
                        dbconnect.get_userAuth({id: insertInfo["insertId"]}, function(error_retrieving_user, results ){
                            if(error_retrieving_user) {
                                var error_key = "get_userAuth_"+Date.now();
                                logger.log({
                                    level: 'error',
                                    time_stamp: Date.now(),
                                    message: error_retrieving_user.message,
                                    error_key: error_key
                                });
                                res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                                    "code":HttpStatus.INTERNAL_SERVER_ERROR,
                                    "message":"error ocurred",
                                    "error_key": error_key
                                })
                            } else {
                                var token = jwt.sign(results[0], process.env.SECRET_KEY);
                                var logData = {
                                    user_id:results[0].id,
                                    ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                                    login_time:moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                                    message: "login successful"
                                }
                                dbconnect.login_log(logData, function(error, results ){})
                                res.status(HttpStatus.OK).send({
                                    "code":200,
                                    "token":token,
                                    "success":"login successful",
                                    "data":results[0]
                                })
                            }
                        })
                    } else {
                        var token = jwt.sign(insertInfo[0], process.env.SECRET_KEY);
                        var logData = {
                            user_id:insertInfo[0].id,
                            ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                            login_time:moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
                            message: "login successful"
                        }
                        dbconnect.login_log(logData, function(error, results ){})
                        res.status(HttpStatus.OK).send({
                            "code":200,
                            "token":token,
                            "success":"login successful",
                            "data":insertInfo[0]
                        })
                    }
                }
            })
        } else {
            res.json({
                success: false,
                message: response.body.message
            })
        }
    });    
};
