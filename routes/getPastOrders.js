var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
var token;
exports.getPastOrders = function (req,res){
  //console.log("req", req);
  var conditions = {
    mobile: req.query.mobile
  }
  dbconnect.get_pastOrders(conditions, function(error, results, fields ){
    if (error) {
      res.status(400).send({
        "code":400,
        "message":"error ocurred"
      })
    }else{
      console.log("results", results);
      if(results.length > 0){
        if(results[0].mobile == conditions.mobile){
          /**token = jwt.sign(results[0], process.env.SECRET_KEY, {
            expiresIn: 5000
          });**/
          res.status(200).send({
            "code":200,
            "success":"sucessfull",
            "data":results
          })
        }
        else{
          res.status(422).send({
            "code":422,
            "message":"No past orders found"
          })
        }
      }
      else{
        //console.log("here", res)
        res.status(422).send({
          "code":422,
          "message":"No past orders found"
        })
      }
    }
  });
}