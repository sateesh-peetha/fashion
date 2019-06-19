const dbconnect = require("./../dbconnect");
const _ = require("lodash");
const HttpStatus = require("http-status-codes");

module.exports = function(req, res) {
  const user_id = req.body.user.id;
  const { page, records_per_page } = req.query;

  dbconnect.get_products_faved_by_friends(user_id, (error, products) => {
    if (error) {
      const error_key = "get_products_faved_by_friends_" + Date.now();
      logger.log({
        level: "error",
        time_stamp: Date.now(),
        message: error.message,
        error_key: error_key
      });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "error ocurred",
        error_key: error_key
      });
    } else if (products.length >= 1) {
      const uniqueUserIds = _(products)
        .map(product => product.friend_id)
        .uniqBy(_.identity)
        .value();
        
      dbconnect.get_user_by_ids(uniqueUserIds, (err, user_list) => {
        if (err) {
          const error_key = "get_products_faved_by_friends_get_user_by_ids" + Date.now();
          logger.log({
            level: "error",
            time_stamp: Date.now(),
            message: err.message,
            error_key: error_key
          });
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "error ocurred",
            error_key: error_key
          });
        } else {
          const mapProduct = product => ({
            friend_id: product.friend_id,
            product_id: product.ig_post_id,
            thumb_image: product.tmb_img_url,
            count: product.gallery_count
          });

          const grouped_by_user_id = _(products)
            .map(mapProduct)
            .groupBy("friend_id")
            .value();

          const mapUser = user => ({
            friend_name: user.name,
            friend_id: user.id,
            products_liked: grouped_by_user_id[user.id]
          });

          const result = _(user_list)
            .map(mapUser)
            .chunk(records_per_page || 10)
            .value();

          res.json({
            products_grouped_by_friends: result[page - 1 || 0],
            total_pages: result.length,
            current_page: page ? parseInt(page) : 1
          });
        }
      });
    } else {
      res.send({});
    }
  });
};

function has_mp4_extension(grouped_s3_urls) {
  if (grouped_s3_urls) {
    var grouped_s3_urls_array = grouped_s3_urls.split(",");
    return !!grouped_s3_urls_array.find(function(url) {
      return url.match(/.mp4$/);
    });
  } else {
    return false;
  }
}
