var dbconnect = require('../dbconnect');
const HttpStatus = require('http-status-codes');

module.exports = function(req,res){
    const { seen_posts } = req.body;
    const user_id = req.body.user.id;
    if(seen_posts.length > 0 ){
        add_seen_post(seen_posts)
    }else{
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
            "code":HttpStatus.INTERNAL_SERVER_ERROR,
            "message":"No Data to update"
        })
    }
    function addPostSeen(item) {
        return new Promise(function(resolve, reject) {
            const dataInsert = {
                user_id:user_id,
                ig_post_id:item.post_id
            }
            dbconnect.add_posts_new_arrival(dataInsert,function(err,row){
                if(err){
                    const data = {
                        items: item.post_id,
                        message:"error occured while adding this item.",
                        error:err
                    }
                    reject(new Error(data));
                }else{
                    const data = {
                        items: item.post_id,
                        message:row.affectedRows ? "sucessfully added as seen." : "post already seen before."
                    }
                    resolve(data)
                }
            });
        }); 
    }
    
    async function add_seen_post(seen_posts){
        let promises = [];
        for (let itemIndex=0; itemIndex<seen_posts.length; itemIndex++){
            promises[itemIndex] = addPostSeen(seen_posts[itemIndex]);
        }
        Promise.all(promises)
        .then(function(values) {
            //console.log(values);
            res.status(HttpStatus.OK).json({result:values});
        })
        .catch(function(err) {
            console.log(err);
            var error_key = "post_seen_"+Date.now();
            logger.log({
                level: 'error',
                time_stamp: Date.now(),
                message: err.message,
                error_key: error_key
            });
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
                "code":HttpStatus.INTERNAL_SERVER_ERROR,
                "message":"error ocurred",
                "error_key": error_key
            })
        });
    } 
};