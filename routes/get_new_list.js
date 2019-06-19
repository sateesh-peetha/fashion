const dbconnect = require("./../dbconnect");
const ErrorHandler = require("../utils/ErrorHandler");
const Helper = require("../utils/Helper");
const _ = require("lodash");
const HttpStatus = require("http-status-codes");

module.exports = function(req, res) {
  const page = req.query.page || 1;
  const records_per_page = req.query.records_per_page || 5;
  const offset = (page - 1) * records_per_page;
  const buyer_id = req.body.user.id;
  dbconnect.getLatestMerchants(buyer_id, records_per_page, offset, (error, merchants) => {
    if (error) {
      ErrorHandler.handleError("getLatestMerchants", error, res);
    } else {
      if (!_.size(merchants)) {
        return res.status(HttpStatus.OK).json({
          stores: [],
          total_pages: 0,
          current_page: 1
        });
      }

      const merchantIds = merchants.map(({ merchant_id }) => merchant_id);
      dbconnect.getNewList(buyer_id, merchantIds, (newListError, images) => {
        if (images) {
          const imageList = _.groupBy(images, "merchant_id");
          const stores = merchants.map(({ merchant_name, merchant_id, logo }) => ({
            store_name: merchant_name,
            store_id: merchant_id,
            logo,
            images: _(imageList[merchant_id])
              .take(8)
              .map(image => ({
                product_id: image.product_id,
                img_url: image.img_url,
                type: image.has_video || Helper.hasMP4Extension(image.grouped_s3_urls) ? "VIDEO" : "IMAGE",
                count: image.count,
                payment_url: "http://chernas.mobyuat.asia/mobilepost_app.html?post_id=" + image.product_id,
                price: image.price,
                post_date: image.post_date,
                description: image.description,
                seen: image.seen
              }))
              .value()
          }));
          res.status(HttpStatus.OK).json({
            stores,
            total_pages: 999, // To be changed
            current_page: page ? parseInt(page) : 1
          });
        } else {
          ErrorHandler.handleError("getNewList", newListError, res);
        }
      });
    }
  });
};
