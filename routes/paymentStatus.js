var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');

exports.getPaymentStatus = function(req,res){
    let userDetail = CheckUser(req, res);

    const conditions = { "referenceNo" :  ( req.query.order_id || req.body.order_id )}

    dbconnect.getPaymentStatus(conditions,function(err,row) {

            if (err) {
                res.json({
                    error: err.message
                })
            } else {
                if ( row.length > 0 ) {
                   if ( row[0].status === "00") {
                       res.json({status: "APPROVED"});
                   }
                   else {
                       res.json({status : "DECLINED"})
                   }
                }
                else {
                    res.json({status : "PENDING"})
                }
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