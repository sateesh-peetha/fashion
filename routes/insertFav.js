const dbConnect = require('./../dbconnect');
const jsonWebToken = require('jsonwebtoken');
const moment = require('moment');
var token = null;

exports.insertFavController = (req, res) => {
    let userDetails = CheckUser(req, res);
    var timestampHelper = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

    var requestedData = {
        id: null,
        user_id: userDetails.userId,
        ig_post_id: req.body.ig_post_id,
        merchant_id : req.body.store_id ,
        post_date: timestampHelper,
        sync_date: timestampHelper,
        created_on: timestampHelper,
        fav_value: req.body.fav
    };

    dbConnect.insertFav(requestedData, (error, info) => {
        if (error) {
            res.status(400).send({
                "status_code": 400,
                "message": error
            });
        } else {
            requestedData.id = info.insertId;
            token = jsonWebToken.sign(requestedData, process.env.SECRET_KEY, {
                expiresIn: '1h'
            });
            res.status(200).send({
                "status_code": 200,
                "results": {
                    "token": token,
                    "data": requestedData,
                    "message": "Item is added to favorites!"
                }
            });
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