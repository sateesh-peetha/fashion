var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
var token;
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
  const user_id = req.body.user.id;
  var { page, records_per_page } = req.query;
  dbconnect.get_stores_faved_by_friends(req.query.friend_id,function(error, products ){
    if (error) {
      var error_key = "get_stores_faved_by_friends_"+Date.now();
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
    } else if (products.length>=1) {
      var grouped_by_stores = _.groupBy(products.sort(function(obj1, obj2){
        return obj1.rank_no-obj2.rank_no
      }), "merchant_name");
      var result = Object.keys(grouped_by_stores).map(function(store){
        return {
          store_name: store,
          ranking: grouped_by_stores[store][0].rank_no,
          store_id: grouped_by_stores[store][0].id,
          logo: grouped_by_stores[store][0].logo,
          images: grouped_by_stores[store].map(function(obj){
            return {
              img_url: obj.tmb_img_url,
              type: (obj.has_video || has_mp4_extension(obj.grouped_s3_urls)) ? "VIDEO" : "IMAGE",
              count: obj.grouped_s3_urls ? obj.grouped_s3_urls.split(",").length : 0,
              product_id: obj.ig_post_id,
            }
          })
        }
      })
      var chunks = _.chunk(result, records_per_page || 10 );
      res.json({
          stores: chunks[page-1 || 0],
          total_pages: chunks.length,
          current_page: page ? parseInt(page) : 1
      });

    } else {
      res.json({
        stores: [],
        total_pages: 1,
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
