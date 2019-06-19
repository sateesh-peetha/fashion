var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){

    let user_id = req.body.user.id;

    dbconnect.get_friends_ids(user_id, function(error, friends ){
        if (error) {
            var error_key = "get_friends_ids_"+Date.now();
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
            if (friends.length == 0) {
                res.json([]);
            } else {
                dbconnect.get_users_by_ids(friends.map(function(obj) { return obj.friend_id }), function(err,users){
                    if(err){
                        var error_key = "get_users_by_ids_"+Date.now();
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
                        res.json(users.map(function(obj){
                            return {
                                id: obj.id,
                                name: obj.name
                            }
                        }));
                    }
                })
            }
        }
    });
}