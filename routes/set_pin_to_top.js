var dbconnect = require('../dbconnect');
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
    const user_id = req.body.user.id;
    const friend_id = req.body.friend_id;
    const data = {user_id : user_id,friend_id:friend_id,increment:1,max:3};
    dbconnect.set_pin_to_top(data,function(error, results ){
        if (error) {
            var error_key = "set_pin_to_top"+Date.now();
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
        }else {
                      res.status(HttpStatus.OK).end();

        }
  });
}
