const dbConnect = require('./../dbconnect');
const jsonWebToken = require('jsonwebtoken');
const moment = require('moment');
var token = null;

exports.readFavController = (req, res) => {
    let userDetails = CheckUser(req, res);
    var timestampHelper = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    const conditions = {
        "user_id": (userDetails.userId || req.body.user_id),
        "ig_post_id": req.body.ig_post_id
    };
    dbConnect.readFavListByUser(conditions, (error, row) => {
        if (error) {
            res.status(400).send({
                "status_code": 400,
                "message": error
            });
        } else {
            if (row.length > 0) {
                res.status(400).json({
                    status: "400",
                    is_fav_already: row[0].fav_value,
                    message: "Already added to favorites list."
                });
            } else {
      
            }
        }
    });
};

const CheckUser = function (req, res) {
    token = req.body.token || req.headers['token'];
    let decoded = jsonWebToken.verify(token, process.env.SECRET_KEY);
    const userDetails = {
        userName: decoded.username,
        userId: decoded.id
    };
    return userDetails;
}