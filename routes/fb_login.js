var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
var axios = require('axios');
var token;
module.exports = function (req,res){
  axios.get('https://graph.facebook.com/debug_token?input_token='+req.body.access_token+'&access_token=314387089390722|8efd1f7012e7733031401f9f9e55b8ba')
  .then(function (response) {
    if (response.data.error) {
      res.status(422).send({
        "code":422,
        "message":response.data.error.message
      })
    } else {
      var request_data = {
        fb_id: req.body.fb_id,
        username: req.body.username,
        fb_token: req.body.access_token,
        login_type: "FACEBOOK"
      }
      dbconnect.create_or_insert_fb_user(request_data, function(error, info){
        if (error){
          console.log(error)
          res.status(400).send({
            "code":400,
            "message":"Bad Request"
          })
        } else {
          request_data.id = info.insertId
          if (info.first_time_user) {
            request_data.first_time_user = true;
          } else {
            request_data.first_time_user = false;
          }
          token = jwt.sign(request_data, process.env.SECRET_KEY, {
            expiresIn: '1h'
          });
          res.status(200).send({
            "code":200,
            "token":token,
            "success":"login sucessfull",
            "data": {
              request_data
            }
          })
        }
      })
    }
  })
  .catch(function (error) {
    console.log(error)
    res.status(422).send({
      "code":422,
      "message":"Invalid username or password"
    })
  });
}