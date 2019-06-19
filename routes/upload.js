const dbConnect = require('./../dbconnect');
const jsonWebToken = require('jsonwebtoken');
const path = require('path');
const moment = require('moment');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const multer = require('multer');

var token = null;
var s3BucketUrlPrefix = 'https://chernas.s3.ap-southeast-1.amazonaws.com/';
var timestampHelper = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");

aws.config.loadFromPath('./aws.config.json');
aws.config.update({
    signatureVersion: 'v4'
});

var s3 = new aws.S3({});

const storage = multer.diskStorage({
    destination: './products/',
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb)
    }
}).any('tmb_img_url');

const checkFileType = (file, cb) => {
    const allowFileType = /jpeg|jpg|png|gif/;
    const extName = allowFileType.test(path.extname(file.originalname).toLowerCase());
    const checkMimeType = allowFileType.test(file.mimetype);
    if (checkMimeType && extName) {
        return cb(null, true);
    } else {
        cb('Error: Only images allow.');
    }
};

exports.uploadController = (req, res) => {
    upload(req, res, error => {
        if (error) {
            res.status(400).json({
                results: {
                    error: error
                }
            });
        } else {
            const results = [].concat(req.files);
            const postedtimeStamp = timestampHelper();
            var requestedData = {
                id: null,
                description: req.body.description,
                tmb_img_url: s3BucketUrlPrefix + req.files[0].path,
                post_url: s3BucketUrlPrefix + req.files[0].path,
                merchant_id: (req.body.merchant_id || req.query.merchant_id),
                price: req.body.price,
                free_size: req.body.free_size,
                free_size_qty: req.body.free_size_qty,
                color: req.body.color,
                xs: req.body.xs,
                s: req.body.s,
                m: req.body.m,
                l: req.body.l,
                xl: req.body.xl,
                post_date: postedtimeStamp,
                sync_date: postedtimeStamp,
                created_on: postedtimeStamp,
            };
            dbConnect.insertUploads(requestedData, (error, info) => {
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
                    results.map(fileResults => {
                        dbConnect.insertPostMultiImages({
                            post_id: requestedData.id,
                            dest_s3_key: fileResults.path,
                            dest_s3_url: s3BucketUrlPrefix + fileResults.path,
                            org_img_url: req.body.org_img_url,
                            created_on: requestedData.created_on
                        });
                    });
                    res.status(200).send({
                        "status_code": 200,
                        "results": {
                            "token": token,
                            "data": requestedData,
                            "message": "Post inserted successfully."
                        }
                    });
                }
            });
        }
    });
};