var dbconnect = require('./../dbconnect');
exports.getinfo = function(req,res){
    dbconnect.get_getinfo(function(err, rows) {
      if (err){
        res.json({
          error: err.message
        })
      } else {
        res.json({
          results: rows
        })
      }
    })
  }