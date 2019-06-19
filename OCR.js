
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();
const https = require('https');
const HttpStatus = require('http-status-codes');
const checks = ["fashion","ladieswear","ladies","fashionoftheday","womensfashion","womenwear","clothing","coatover","Shirt","Skirt","Jumpsuit","Jumpsuit Pant"];

//test verification
var fs = require("fs");

exports.extractByURL = (url,cb) => {

  client
  .textDetection(url)
  .then(results => {
    const detections = results[0].textAnnotations;
    let URIhash = {};
    var ig_hash = {};
    let det = detections[0].description.replace(/\n/g,' ').split(' ');
    let pres = {};
    let detection = [];
    var buffer  = {};
    var is_sent     = false;

    det.map ( val => {
      val = val.toLowerCase();
      if ( pres.hasOwnProperty(val) ? false : pres[val] = true )
      if ( val !== '')
      detection.push(val);
    });

    let length = detection.length;

    detection.map( (str) => {
      let url = 'https://www.instagram.com/' + encodeURIComponent(str) + '/';
      URIhash[url] = str;

      https.get(url, (res) => {

        let checklength = 1;
        buffer[url] = [];
        if ( res.statusCode !== HttpStatus.OK)
         ig_hash[URIhash[url]] = false;

        res.on('data', (d) => {
          buffer[url].push(d);
        });

        res.on('end',function(){

          let data = Buffer.concat(buffer[url]);
          data = data.toString('utf8');
          checks.map ( str => {

            if (data.indexOf(str) !== -1) {
              ig_hash[URIhash[url]] = true;
              if( Object.keys(ig_hash).length == length) {

                if( is_sent == false)
                cb ( {  status : "SUCCESS" , data : ig_hash });

                is_sent = true;

              }
            } else {
              if (!ig_hash.hasOwnProperty(URIhash[url]))
              ig_hash[URIhash[url]] = false;

              if( Object.keys(ig_hash).length == length && checks.length == checklength) {
                if( is_sent == false)
                 cb ( { status : "SUCCESS" , data : ig_hash });

                is_sent = true;
              }
            }
            checklength++;
          });
        });

      }).on('error', (e) => {
        cb ( { error : e , status : "FAILED" });
      });
    });
  })
  .catch(err => {
    cb ( { error : err , status : "FAILED" });
  });

}
