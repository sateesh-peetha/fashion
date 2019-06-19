var dbconnect = require('../../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
var token;
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
    const buyer_id = req.body.user.id;
    var { page, records_per_page } = req.query;
    dbconnect.get_stores_list(buyer_id,function(error, results ){
        if (error) {
            var error_key = "get_stores_list_"+Date.now();
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
            // run from here
            dbconnect.get_store_ids(buyer_id, function (err, id) {
                if (err) {
                    var error_key = "get_store_ids_"+Date.now();
                    logger.log({
                        level: 'error',
                        time_stamp: Date.now(),
                        message: err.message,
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
                            ig_post_id: result_obj.ig_post_id,
                            store_name: result_obj.merchant_name,
                            img_url: result_obj.tmb_img_url,
                            logo: result_obj.logo,
                            ranking: result_obj.rank_no,
                            buyer: result_obj.buyer_id,
                            count:result_obj.cnt,
                            type: (result_obj.has_video || has_mp4_extension(result_obj.grouped_s3_urls)) ? "VIDEO" : "IMAGE",
                        }
                    }), "store_id");

                    //var st_id = id.map((obj) => {return obj.merchant_id});
                    //var store_ids = Object.keys(grouped_by_store_id);
                    var store_ids = id.map((obj) => {return obj.merchant_id});
                    var filtered_store_ids = store_ids.filter((id) => {
                        return grouped_by_store_id[id] && grouped_by_store_id[id].length>0 && grouped_by_store_id[id][0].buyer != null
                    });
                    var final_result = filtered_store_ids.map((id) => {
                        return {
                            store_name: grouped_by_store_id[id.toString()][0].store_name,
                            ranking: grouped_by_store_id[id.toString()][0].ranking,
                            store_id: grouped_by_store_id[id.toString()][0].store_id,
                            logo: grouped_by_store_id[id.toString()][0].logo,
                            buyer: grouped_by_store_id[id.toString()][0].buyer,
                            images: grouped_by_store_id[id.toString()].map((obj) => {
                                return {
                                    img_url: obj.img_url,
                                    type: obj.type,
                                    count: obj.count,
                                    product_id: obj.ig_post_id,
                                    payment_url: obj.payment_url
                                }
                            })
                        }
                    });
                    var chunks = _.chunk(final_result.sort(function(obj1,obj2) {
                        return (obj1.ranking - obj2.ranking);
                    }), records_per_page || 10 ); 
                    res.json({
                        stores: chunks[page-1 || 0],
                        total_pages: chunks.length,
                        current_page: page ? parseInt(page) : 1
                    });
                }
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
