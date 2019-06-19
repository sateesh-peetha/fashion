var dbconnect = require('../../dbconnect');
var unirest = require('unirest');

module.exports = function (req,res){

    var phone_number = req.body.phone_number;
    var country_code = req.body.country_code;

    unirest.post('https://api.authy.com/protected/json/phones/verification/start')
    .header('Content-Type', 'application/json')
    .header('X-Authy-API-Key', process.env.AUTHY_KEY)
    .send({ "via": "sms", "phone_number": phone_number, "country_code": country_code})
    .end(function (response) {
        if(response.body.success) {
            res.json({
                success: true,
                message: "OTP has been successfully sent to: "+country_code+""+phone_number
            })
        } else {
            res.json({
                success: false,
                message: response.body.message
            })
        }
    });    
};