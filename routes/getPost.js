var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');

//var CryptoJS = require('crypto-js');

exports.getPost = function (req, res) {
    let userDetail = req.body.user;
    let resultCount = 0;
    let postResult = [], galleryResult = [], stockResult = [];

    var conditions = {id: (req.query.post_id || req.body.post_id)};


    function sendResults() {

        resultCount = resultCount + 1;

        if (resultCount == 3) {
            var statusCode = 200;

            if (postResult.length == 0) {
                statusCode = 204;
            }
            else if ( galleryResult.length == 0 || stockResult.length == 0 ) {
                statusCode = 206;
            }
            res.status(statusCode).json({
                results: {
                    data: {post_details: postResult[0], gallery: galleryResult, stock: stockResult}
                }
            });
            res.end();
            resultCount = 0;
        }

    }


    dbconnect.get_post_details(conditions, function (err, rows) {
        if (!err) {
            if ( rows.length > 0 ) {
                rows[0].isFave = (rows[0].isFave == 1 ? true : false);
            }
            postResult = rows.map(function(row){
                row.product_url = "https://gigi-asia-buyer.test-app.link/product-details/"+row.id;
                return row;
            });
            sendResults();
        }
        else {
            res.status(500).json({
                error: err.message
            });
        }
    });

    dbconnect.get_image_gallery(conditions, function (err, rows) {
        if (!err) {
            galleryResult = rows;
            sendResults();
        }
        else {
            res.status(500).json({
                error: err.message
            });
        }
    });

    dbconnect.get_stock(conditions, function (err, rows) {
        if (!err) {
            stockResult = rows;
            sendResults();
        }
        else {
            res.status(500).json({
                error: err.message
            });
        }
    });


};