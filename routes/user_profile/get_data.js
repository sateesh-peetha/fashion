const dbconnect = require("../../dbconnect");
const ErrorHandler = require("../../utils/ErrorHandler");
const HttpStatus = require("http-status-codes");

module.exports = function(req, res) {
  const user_id = req.body.user.id;
  dbconnect.getUserProfile(user_id, (error, results) => {
    if (error) {
      ErrorHandler.handleError("getUserProfile", error, res);
    } else {
      if (results.length == 0) {
        res.status(HttpStatus.OK).json({
          new_user: true
        });
      } else {
        dbconnect.getFollowedMerchants(user_id, (follwedMerchantError, followedMerchantResults) => {
          if (follwedMerchantError) {
            ErrorHandler.handleError("getFollowedMerchants", follwedMerchantError, res);
          } else {
            results[0].new_user = followedMerchantResults.length < 3;
            res.status(HttpStatus.OK).json(results[0]);
          }
        })
      }
    }
  });
};
