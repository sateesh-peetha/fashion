var dbConnect = require('./../dbconnect');
const jsonWebToken = require('jsonwebtoken');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');


exports.getRecommededStoresListController = (req, res) => {

    const { records_per_page, page } = req.query;
    let limit=records_per_page ? parseInt(records_per_page) : 300;
    let offset= page ? parseInt(page) : 0;
    let buyer_id = req.body.user.id;

  dbConnect.getRecommededStoresList(buyer_id,limit, limit*offset, function(error, results) {
    if (error) {
        // here we have server error but not client error. fixing right status code
    res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR).send({
      "code": HttpStatus.INTERNAL_SERVER_ERROR,
      "message": error
    });
  } else {

        var grouped_by_store_id = _.groupBy(results.map(result_obj => {
            return {
                store_id: result_obj.store_id,
                ig_post_id: result_obj.post_id,
                store_name: result_obj.merchant_name,
                img_url: result_obj.tmb_img_url,
                logo: result_obj.logo,
                type:result_obj.type,
                count:result_obj.cnt,
                payment_url: "http://chernas.mobyuat.asia/mobilepost_app.html?post_id=" + result_obj.post_id,
            }
        }), "store_id");


        var store_ids = Object.keys(grouped_by_store_id);

        var final_result = store_ids.map((id) => {
            return {
                store_name: grouped_by_store_id[id.toString()][0].store_name,
                store_id: grouped_by_store_id[id.toString()][0].store_id,
                logo: grouped_by_store_id[id.toString()][0].logo,
                images: grouped_by_store_id[id.toString()].map((obj) => {
                    return {
                        img_url: obj.img_url,
                        type:obj.type,
                        ig_post_id: obj.ig_post_id,
                        payment_url: obj.payment_url,
                        count:obj.count
                    }
                })
            }
        });
    res.status(HttpStatus.OK).json(final_result)
  }
  });
}

