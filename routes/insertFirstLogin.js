const dbConnect = require('./../dbconnect');
const jsonWebToken = require('jsonwebtoken');
const moment = require('moment');
var token = null;

exports.firstTimeLoginController = (req, res) => {
  var checkIfDeilveryEnable = (req.body.deliveryOption === 'yes' ? true : false);
  var requestedData = {
    order_id: (req.body.order_id || req.query.order_id),
    id: null,
    dt_created: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss"),
    merchant_id: req.query.merchant_id,
    mobile: req.body.mobile_no,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    address: req.body.address,
    dt_date: moment(Date.parse(req.body.dt_date)).format('YYYY-MM-DD').toString(),
    date_timeslot: req.body.date_timeslot,
    deliveryOptions: (checkIfDeilveryEnable ? {
      pickup_option_name: req.body.pickup_option_name,
      pickup_option_mobile_no: req.body.pickup_option_mobile_no
    } : {
      status: false
    })
  };
  dbConnect.insertFirstTimeLogin(requestedData, (error, info) => {
    if (error) {
      res.status(400).send({
        "status_code": 400,
        "message": "Bad Request."
      });
    } else {
      requestedData.id = info.insertId
      token = jsonWebToken.sign(requestedData, process.env.SECRET_KEY, {
        expiresIn: '1h'
      });
      res.status(200).send({
        "status_code": 200,
        "results": {
          "token": token,
          "data": requestedData
        }
      });
    }
  });
};
