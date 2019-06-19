var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
const requestIp = require('request-ip');
const moment = require('moment');

var token;
exports.login = function (req,res){
  var conditions = {
          mobile: req.body.username,
          password: req.body.password
        }
  const logData = {
    user_id:req.body.username,
    ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    login_time:moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
    message: ""
  }
  dbconnect.get_userAuth(conditions, function(error, results, fields ){
    if (error) {
      logData.message =  "Bad Request";
      login_log(logData);
      res.status(400).send({
        "code":400,
        "message":"Bad Request"
      })
    }else{
      //console.log("results", results);
      if(results.length > 0){
        if(results[0].password == conditions.password){
          //have to set expiry and refresh token
          token = jwt.sign(results[0], process.env.SECRET_KEY);
          logData.message =  "login sucessfull";
          login_log(logData);
          res.status(200).send({
            "code":200,
            "token":token,
            "success":"login sucessfull",
            "data":results[0]
          })
        }
        else{
          logData.message =  "Invalid username or password";
          login_log(logData);
          res.status(422).send({
            "code":422,
            "message":"Invalid username or password"
          })
        }
      }
      else{
        //console.log("here", res)
        logData.message =  "Invalid username or password";
        login_log(logData);
        res.status(422).send({
          "code":422,
          "message":"Invalid username or password"
        })
      }
    }
  });

  function login_log(data){
    dbconnect.login_log(data, function(error, results ){})
  }
}