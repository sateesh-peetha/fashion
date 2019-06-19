var dbconnect = require('../../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
var token;
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
    const user_id = req.body.user.id;
    const { query, page, records_per_page } = req.query;
    dbconnect.get_all_stores_list(user_id, query ,function(error, results ){
        if (error) {
            var error_key = "get_all_stores_list_"+Date.now();
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
            var grouped_by_store_id = _.groupBy(results.map(result_obj => {
                return {
                    store_id: result_obj.merchant_id,
                    product_id: result_obj.product_id,
                    store_name: result_obj.merchant_name,
                    img_url: result_obj.img_url,
                    logo: result_obj.logo,
                    count:result_obj.count,
                    type: (result_obj.has_video || has_mp4_extension(result_obj.grouped_s3_urls)) ? "VIDEO" : "IMAGE",
                }
            }), "store_id");

            var final_result = Object.keys(grouped_by_store_id).map(function(id){
                return {
                        store_name: grouped_by_store_id[id.toString()][0].store_name,
                        store_id: grouped_by_store_id[id.toString()][0].store_id,
                        logo: grouped_by_store_id[id.toString()][0].logo,
                        images: grouped_by_store_id[id.toString()].map((obj) => {
                            return {
                                img_url: obj.img_url,
                                product_id: obj.product_id,
                                count: obj.count,
                                type: obj.type
                            }
                        })
                    }
            });
            var chunks = _.chunk(final_result, records_per_page || 10 );
            res.json({
                stores: chunks[page-1 || 0],
                total_pages: chunks.length,
                current_page: page ? parseInt(page) : 1
            });
        }
    });
}

function has_mp4_extension(grouped_s3_urls) {
  if (grouped_s3_urls) {
    var grouped_s3_urls_array = grouped_s3_urls.split(",");
    return !!grouped_s3_urls_array.find(function(url) {
      return url.match(/.mp4$/);
    })
  } else {
    return false;
  }
}