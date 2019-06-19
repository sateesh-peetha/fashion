var dbconnect = require('./../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
var token;
var ranking = [];

module.exports = function (req,res){
  var payment_methods = [
    {
      id:1,
      bank:'SCB',
      payment_flow_required: true,
      logo: process.env.HOST+"/images/banks/scb.png",
      video_tutorial: process.env.HOST+"/video/banks/scb.mp4",
    },
    {
      id:2,
      bank:'KBank',
      payment_flow_required: true,
      logo: process.env.HOST+"/images/banks/kbank.png",
      video_tutorial: process.env.HOST+"/video/banks/kbank.mp4",
    },
    {
      id:3,
      bank:'BBL',
      payment_flow_required: true,
      logo: process.env.HOST+"/images/banks/bbl.png",
      video_tutorial: process.env.HOST+"/video/banks/bbl.mp4",
    },
    {
      id:4,
      bank:'COD',
      payment_flow_required: false,
      logo: null,
      video_tutorial: null
    }
  ]
  res.json(payment_methods);
}
