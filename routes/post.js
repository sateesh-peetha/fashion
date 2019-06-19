var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
//var CryptoJS = require('crypto-js');

exports.getPost = function(req,res){
    const { records_per_page = 10, page = 0 } = req.query;
    const pageNumber = parseInt(page ? page : 0);
    const limit = parseInt(records_per_page);
    const offset = pageNumber * limit;
    // add later for merchant and filters
    const conditions = { "1" : 1}

    const user_id = req.body.user.id;
    
    dbconnect.get_posts_cnt(conditions,function(err,row) {

     const totalPosts = row[0].cnt;

        dbconnect.get_posts(user_id, limit, limit*offset, function (err, rows) {
            if (err) {
                res.json({
                    error: err.message
                })
            } else {
                res.json({
                    results: {
                        data: rows,
                        pageInfo: {
                            records_per_page: limit,
                            page: pageNumber,
                            Total: totalPosts
                        }
                    }
                })
            }
        });
    });
};