const dbConnect = require('./../dbconnect');
const jsonWebToken = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const HttpStatus = require('http-status-codes');
const ocr        = require('./../OCR');


const storage = multer.diskStorage({
  destination: './OCR/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb)
  }
}).any('test');

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

exports.detectIGID = (req, res) => {

  var buyer_id = req.body.user.id;

  upload(req, res, error => {
    if (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        results: {
          error: error
        }
      });
    } else {

      const results = [].concat(req.files);
      let imgURL = req.files[0].path;
      ocr.extractByURL(imgURL,function(res) {

        if (res.status === "SUCCESS" )
        //  res.result.map( ig_id => {
        if(Object.keys(res.data).length > 0) {
          for (var ig_id in res.data ) {
            let data = { ig_id : ig_id, buyer_id:buyer_id};
            if ( res.data[ig_id] == true ) {

            dbConnect.add_ig_detection(data,function(err,result){
              if(err) {
                let error_key = "detect_ig_id"+Date.now();
                logger.log({
                  level: 'error',
                  time_stamp: Date.now(),
                  message: err,
                  error_key: error_key
                });
              }
            });

            dbConnect.add_merchant({ig_id : ig_id},function(err,res) {
              if(err) {
                let error_key = "detect_ig_id"+Date.now();
                logger.log({
                  level: 'error',
                  time_stamp: Date.now(),
                  message: JSON.stringify(err),
                  error_key: error_key
                });
              }
              else {
                    let merchant_id = res.insertId;
                    dbConnect.follow_merchant({user_id :buyer_id, merchant_id :merchant_id},function(err,res){
                      if(err) {
                        let error_key = "detect_ig_id"+Date.now();
                        logger.log({
                          level: 'error',
                          time_stamp: Date.now(),
                          message: JSON.stringify(err),
                          error_key: error_key
                        });
                    }
                  });
              }
            })
            }
          }
        }

        else {
          let error_key = "detect_ig_id"+Date.now();
          logger.log({
            level: 'error',
            time_stamp: Date.now(),
            message: JSON.stringify(res.error),
            error_key: error_key
          });
        }
      });
      res.status(HttpStatus.OK).send({status:"SUCCESS"});
      res.end();
    }
  });


};
