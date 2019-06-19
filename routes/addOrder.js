var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');

exports.addOrder = function(req,res){
    let userDetail = CheckUser(req, res);

    dbconnect.addOrder(function(err,row) {

        if (err) {
            res.json({
                error: err.message
            })
        } else {
            res.json({"order_id" : row.insertId})
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