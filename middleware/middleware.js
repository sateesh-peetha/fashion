var jwt = require('jsonwebtoken');

exports.middleware = function(req, res, next) {

    var token = req.body.token || req.headers['token'];
    var appData = {};
    if (token) {
      jwt.verify(token, process.env.SECRET_KEY, function(err, data) {
        if (err) {
          if (err.name == "TokenExpiredError") {
            appData["token_expired"] = true
          }
          appData["error"] = 1;
          appData["data"] = "Invalid token, please send the correct token";
          res.status(500).json(appData);
        } else {
          req.body.user = data;
          next();
        }
      });
    } else {
      appData["error"] = 1;
      appData["data"] = "Please send a token";
      res.status(403).json(appData);
    }
  }