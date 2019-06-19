var dbConnect = require('./../dbconnect');
const moment = require('moment');

exports.delete_ranking = function (req, res) {
    const {merchant_id} = req.query;
    const condition = {
        "buyer_id":req.body.user.id,
        "merchant_id":parseInt(merchant_id),
        'deleted_at': null
    }// Addded deleted_at as product already deleted the not need to delete again
    const soft_delete_condition = {
        deleted_at:moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")
    }   
    dbConnect.select_merchant_rank_fo_buyer(condition, (err,row)=> {
        if(err){
            res.status(500).send({
                "status_code": 500,
                "message": "Server Error, bad request."
            });
        } else {
            if(row.length>0){
                //Delete merchant Rank
                dbConnect.delete_merchant_rank_for_buyer(condition,soft_delete_condition, (error, info) => {
                    if (error) {
                        res.status(500).send({
                            "status_code": 500,
                            "message": "Server error for update rank."
                        });
                    }else{
                        res.status(200).send({
                            "status_code": 200,
                            results: {"merchant_id":merchant_id,"message":"Record Deleted."}
                        });
                    }
                });
            }else{
                res.status(400).send({
                    "status_code": 400,
                    "message": "No such records found!."
                });
            }
        }
    })
};