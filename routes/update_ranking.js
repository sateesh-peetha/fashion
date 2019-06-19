var dbConnect = require('./../dbconnect');
const moment = require('moment');

exports.get_update_ranking = function (req, res) {
    const {data} = req.body;
    const dt_created =  moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    let opCout=0;

    function inser_update_rank(selectCondition,item){
        dbConnect.select_merchant_rank_fo_buyer(selectCondition, (err,row)=> {
            if(err){
                res.status(500).send({
                    "status_code": 500,
                    "message": "Server Error, bad request."
                });
            } else {
                if(row.length>0){
                    const updateCondition = {
                        "buyer_id":req.body.user.id,
                        "merchant_id":row[0].merchant_id,
                        'deleted_at': null
                    }//Added deleted_at as product already deleted 
                    const updateData = {
                        "rank_no":parseInt(item.rank_no),
                        "dt_created":dt_created
                    }
                    //Update merchant Rank
                    dbConnect.update_merchant_rank(updateCondition,updateData, (error, info) => {
                        if (error) {
                            res.status(500).send({
                                "status_code": 500,
                                "message": "Server error for update rank."
                            });
                        } 
                    });
                }else{
                    const insertData = {
                        "buyer_id":req.body.user.id,
                        "rank_no":parseInt(item.rank_no),
                        "merchant_id":parseInt(item.merchant_id),
                        "dt_created":dt_created
                    }
                    // insert new merchant Rank
                    dbConnect.insert_merchant_rank(insertData, (error, info) => {
                        if (error) {
                            res.status(500).send({
                                "status_code": 500,
                                "message": "Server error for update rank."
                            });
                        } 
                    });
                }
            }
        })
    }
    for (var index =0; index<data.length;index++){
        opCout++;
        const selectCondition = {
            "buyer_id":req.body.user.id,
            "merchant_id":parseInt(data[index].merchant_id)
        }   
        inser_update_rank(selectCondition, data[index]);       
    }
    if(data.length === opCout){
        res.status(200).send({
            "status_code": 200,
            "message": "Rank update successfully!!"
        });
    }else{
        res.status(500).send({
            "status_code": 500,
            "message": "Server Error..."
        });
    }
};