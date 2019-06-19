var dbconnect = require('../../dbconnect');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
    const user_id = req.body.user.id;
    const data = {user_id:user_id,post_cnt:7,limit:70};
    const page_no = 1;
    dbconnect.get_rec_store_list(data ,function(error, results ){
        if (error) {
            var error_key = "get_recommended_stores_"+Date.now();
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
                    type: result_obj.type,
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

            res.json({
                stores: final_result,
                // Agreed with Yii, no pagination implmented for this end point. Retaining page info attributes so app can reuse the components
                total_pages: page_no ,
                current_page:  page_no
            });

    }
  });
}
