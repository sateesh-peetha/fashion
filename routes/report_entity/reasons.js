var dbconnect = require('../../dbconnect');
var jwt = require('jsonwebtoken');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){

    dbconnect.get_report_reasons(function(error, reasons ){
        if (error) {
            var error_key = "get_report_reasons_"+Date.now();
            logger.log({
                level: 'error',
                time_stamp: Date.now(),
                message: error.message,
                error_key: error_key
            });
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                "code":HttpStatus.INTERNAL_SERVER_ERROR,
                "message":"error ocurred",
                "error_key": error_key
            })
        } else {
            res.json(reasons);
        }
    });
}