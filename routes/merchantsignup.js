var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
//var CryptoJS = require('crypto-js');

exports.getStatus = function(req,res){
    let userDetail = CheckUser(req, res);

        var conditions =  { id : ( req.query.merchant_id || req.body.merchant_id ) };
        dbconnect.get_merchant_status(conditions, function (err, rows) {
            if (err) {
                res.json({
                    error: err.message
                })
            } else {

                res.json({
                    results: {
                        data: rows
                    }
                })
            }
        });
};

const CheckUser = function(req,res){
    var token = req.body.token || req.headers['token'];
    let decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userDetail = {
        userName:decoded.username,
        userId:decoded.id
    };
    return userDetail;
}