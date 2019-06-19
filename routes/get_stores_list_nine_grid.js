var dbconnect = require('./../dbconnect');
var _ = require("lodash");
const HttpStatus = require('http-status-codes');

module.exports = function (req,res){
  const { records_per_page, page , merchant_id } = req.query;
  let limit=records_per_page ? parseInt(records_per_page) : 9;
  let offset= page ? parseInt(page) : 0;
  
  const partitionArray = (array, size) => array.map( (e,i) => (i % size === 0) ? array.slice(i, i + size) : null ) .filter( (e) => e )
  dbconnect.get_nine_grid_per_store(merchant_id,limit,limit*offset,function(error, results ){
    if (error) {
      var error_key = "get_store_details_"+Date.now();
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
    }else{
      var chunks = _.chunk(results, records_per_page || 9 );
        var grouped_by_store_id = _.groupBy(chunks[page-1 || 0].map(result_obj=>{
          return {
            store_id: result_obj.merchant_id,
            ig_post_id: result_obj.ig_post_id,
            store_name: result_obj.merchant_name,
            img_url: result_obj.tmb_img_url,
            logo: result_obj.logo,
            type:result_obj.type,
            count:result_obj.cnt,
          }
        }), "store_id");
        var store_ids = Object.keys(grouped_by_store_id);
        var filter_stotre_ids = store_ids.filter((id)=>{
          return grouped_by_store_id[id] && grouped_by_store_id[id][0]
        });
        var final_result = filter_stotre_ids.map((id)=>{
          return {
            store_name: grouped_by_store_id[id][0].store_name,
            store_id: grouped_by_store_id[id][0].store_id,
            logo: grouped_by_store_id[id][0].logo,
            images: partitionArray(grouped_by_store_id[id].map((obj)=>{
              return {
                img_url: obj.img_url,
                product_id: obj.ig_post_id,
                type:obj.type,
                count:obj.count
              }
            }),3),
          }
        });
        //res.status(HttpStatus.OK).send(final_result);
        res.json({
          data: final_result,
          total_pages: chunks.length,
          current_page: page ? parseInt(page) : 1
      });
    }
  });
}