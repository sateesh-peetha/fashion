var Db = require('mysql-activerecord');
var dbconfig = require("./database")[process.env.NODE_ENV]
var dbMerchantconfig = require("./databaseMerchant")[process.env.NODE_ENV]
var dbGigiLipz = require("./databaseGigiLipz")[process.env.NODE_ENV]
var dbconfigchernas = require("./databasechernas")[process.env.NODE_ENV];
var db = new Db.Adapter(dbconfig);
var dbM = new Db.Adapter(dbMerchantconfig);
var dbLipz = new Db.Adapter(dbGigiLipz);
var dbchernas = new Db.Adapter(dbconfigchernas);
const moment = require('moment');

function get_getinfo(cb) {
  db.select(['id', 'name', 'address' , 'mobile']).get('TestTemp', function(err, rows) {
        cb(err, rows);
  })
}


function get_userAuth(data, cb) {
  db.where(data).get('users', function(err, rows) {
      cb(err, rows);

  })
}

function get_pastOrders(data, cb) {
  dbLipz
  .get('orders')
  .join('merchant', 'orders.merchant_id = merchant.id', 'LEFT')
  .where({"orders.mobile": data.mobile})
  .order_by('orders.dt_created DESC')
  .get('orders', function(err, rows) {
    cb(err, rows);
  })
}


function get_posts_cnt(conditions,cb) {
    dbchernas.select(['count(*) as cnt'])
        .get('ig_post', function(err, rows) {
            cb(err, rows);
        })
}

var login_log = (data, cb) => {
  dbchernas
    .insert('app_login_log', {
      user_id: data.user_id,
      ip_address: data.ip_address,
      login_time: data.login_time,
      message: data.message
    }, (err, info) => {
      cb(err, info);
    });
};

/*
 * A helper to insert requested data like merchant_id, rank_no
 *
 * @return void
 *
 */
var insertRankCounts = (requestedData, cb) => {
  dbchernas
    .insert('merchant_ranks', {
      buyer_id: requestedData.buyer_id,
      rank_no: requestedData.rank_no,
      merchant_id: requestedData.merchant_id,
      dt_created: requestedData.dt_created
    }, (err, info) => {
      cb(err, info);
    });
};

var update_merchant_rank = (updateCondition,updateData, cb) => {
  dbchernas
  .where(updateCondition)
    .update('merchant_ranks', updateData, (err, info) => {
      cb(err, info);
    });
};//Done for Soft Delete

var insert_merchant_rank = (insertData, cb) => {
  dbchernas
    .insert('merchant_ranks', insertData, (err, info) => {
      cb(err, info);
    });
};

var select_merchant_rank_fo_buyer = (condition, cb) => {
  dbchernas
  .where(condition)
  .get('merchant_ranks', function(err, rows) {
    cb(err, rows);
  })
};//Done for Soft Delete

var delete_merchant_rank_for_buyer = (condition,soft_delete_condition, cb) => {
  dbchernas
  .where(condition)
    .update('merchant_ranks', soft_delete_condition, (err, info) => {
      cb(err, info);
    });
};//Done for Soft Delete

/*
 * A helper to read rank_no by passing merchant_id
 *
 * @return rank_no object
 *
 */
var readRankCounts = (cb) => {
  dbchernas
  .select('merchant_ranks.rank_no')
    .get('merchant_ranks', (err, rows) => {
      cb(err, rows);
    });
};

function get_stores_list(buyer_id, cb) {
    const query = `Select distinct merchant.merchant_name, merchant_ranks.rank_no,
                  merchant_ranks.merchant_id, merchant.logo, buyer_followed_merchant.buyer_id,
                  ig_post.id as post_id, ig_post.tmb_img_url, ig_post.id as ig_post_id,
                  ig_post.has_video, pst_cnt.grouped_s3_urls, pst_cnt.cnt
                  from merchant_ranks inner JOIN merchant on merchant.id=merchant_ranks.merchant_id
                  left join
                  (
                    select distinct id, post_date, merchant_id, tmb_img_url, deleted_at, has_video,
                    @post_rank := IF(@cmerchant = merchant_id,@post_rank+1,1) as post_rank,
                    @cmerchant := merchant_id from
                      (select * from ig_post order by merchant_id,post_date desc) ip
                  ) ig_post on ig_post.merchant_id = merchant.id
                  inner JOIN buyer_followed_merchant on merchant.id = buyer_followed_merchant.merchant_id
                  inner join
                  (
                    select post_id ,count(post_id) as cnt, GROUP_CONCAT(dest_s3_url SEPARATOR ',') as grouped_s3_urls
                    from ig_post_img where deleted_at is NULL group by post_id
                  ) pst_cnt on ig_post.id = pst_cnt.post_id
                  where ig_post.deleted_at IS NULL and merchant_ranks.buyer_id= ${buyer_id} and merchant_ranks.deleted_at is null and
                  buyer_followed_merchant.buyer_id = ${buyer_id} and buyer_followed_merchant.deleted_at is null
                  and ig_post.post_rank <= 100
                  ORDER BY merchant_ranks.rank_no ASC,ig_post.post_date DESC;`;
  dbchernas.query(query,
  function(err, results) { cb(err, results) });
}//Done for Soft Delete

// return store id followed by buyer
function get_store_ids(buyer_id, cb) {
    const query = ` Select distinct merchant_ranks.merchant_id from merchant_ranks
                    inner JOIN merchant on merchant.id=merchant_ranks.merchant_id
                    inner JOIN buyer_followed_merchant on merchant.id = buyer_followed_merchant.merchant_id
                    inner JOIN ig_post ON ig_post.merchant_id = merchant.id
                    where ig_post.deleted_at IS NULL and
                      merchant_ranks.buyer_id= ${buyer_id}
                      and merchant_ranks.deleted_at is null
                      and buyer_followed_merchant.buyer_id = ${buyer_id}
                      and buyer_followed_merchant.deleted_at is null
                    ORDER BY merchant_ranks.rank_no ASC;`
    dbchernas.query(query,
        function(err, results) { cb(err, results) });
}//Done for Soft Delete

function get_posts(conditions,limit,offset, cb) {

  const query = "Select distinct ig_post.id, ig_post.description, ig_post.tmb_img_url as dest_s3_url,"+
              " case when user_seen_post.ig_post_id IS NOT NULL AND user_seen_post.user_id ="+conditions+
              " then true else false end as seen" +
              " from ig_post left join user_seen_post on ig_post.id  = user_seen_post.ig_post_id"+
              " where ig_post.deleted_at IS NULL order by ig_post.post_date desc, ig_post.sync_date desc LIMIT "+ limit + " OFFSET "+offset+" ;";
  dbchernas.query(query, function (err, results){
    cb(err, results)
  });
}

function getLatestMerchants(buyer_id, limit, offset, callback) {
  const query = `
    SELECT
      MAX(ig_post.post_date) AS post_date,
      ig_post.merchant_id,
      merchant.logo,
      merchant.merchant_name
    FROM ig_post
    INNER JOIN merchant_ranks ON merchant_ranks.merchant_id = ig_post.merchant_id
    INNER JOIN merchant ON merchant.id = ig_post.merchant_id
    WHERE merchant_ranks.buyer_id = ${buyer_id} AND merchant_ranks.deleted_at IS NULL AND ig_post.deleted_at IS NULL
    GROUP BY ig_post.merchant_id
    ORDER BY post_date DESC
    LIMIT ${limit}
    OFFSET ${offset};
  `;
  dbchernas.query(query, callback);
}

function getNewList(buyer_id, merchantIds, callback) {
  const query = `
    SELECT DISTINCT
      ig_post.id as 'product_id',
      ig_post.description,
      ig_post.post_url,
      ig_post.merchant_id,
      ig_post.price,
      ig_post.tmb_img_url as 'img_url',
      ig_post.post_date,
      ig_post.has_video,
      ip_cnt.count,
      ip_cnt.grouped_s3_urls,
      (CASE WHEN user_seen_post.ig_post_id IS NOT NULL AND user_seen_post.user_id = ${buyer_id} THEN true ELSE false END ) AS seen
    FROM ig_post
    INNER JOIN (
      SELECT post_id ,COUNT(post_id) as count, GROUP_CONCAT(dest_s3_url SEPARATOR ',') AS grouped_s3_urls
      FROM ig_post_img where deleted_at is NULL GROUP BY post_id
    ) ip_cnt on ip_cnt.post_id = ig_post.id
    LEFT JOIN user_seen_post ON ig_post.id = user_seen_post.ig_post_id
    WHERE ig_post.deleted_at IS NULL and ig_post.merchant_id IN (${merchantIds.join(",")})
    ORDER BY ig_post.post_date DESC;
  `;
  dbchernas.query(query, callback);
}

function add_posts_new_arrival(data,cb){
const query = "INSERT INTO user_seen_post (user_id, ig_post_id)" +
                " SELECT * FROM (SELECT "+data.user_id+", "+data.ig_post_id+") AS tmp"+
                " WHERE NOT EXISTS ( SELECT user_id, ig_post_id FROM user_seen_post WHERE user_id = "+data.user_id+" AND ig_post_id = "+data.ig_post_id+
                " ) LIMIT 1 ;";
  dbchernas.query(query, function (err, results){
    cb(err, results)
  });
}

function get_nine_grid_per_store(merchant_id,limit,offset, cb) {
  const query = "Select DISTINCT ip.id as 'ig_post_id', merchant.logo, ip.tmb_img_url, ip.id as 'post_id', "+
                "merchant.id as 'merchant_id', merchant.merchant_name, pst_cnt.cnt, "+
                "(case when pst_cnt.dest_s3_url RLIKE '^.*\.(mp4)$' then 'VIDEO' else 'IMAGE' end ) as type "+
                "from ig_post as ip LEFT JOIN merchant on ip.merchant_id = merchant.id "+
                "inner join ( select post_id,dest_s3_url ,count(post_id) as cnt from ig_post_img where deleted_at is NULL group by post_id) pst_cnt on ip.id = pst_cnt.post_id "+
                "Where ip.deleted_at IS NULL and ip.merchant_id="+merchant_id+
                " Order by ip.post_date desc";
                //" Order by ip.post_date desc LIMIT "+limit+" OFFSET "+offset;
  dbchernas.query(query,
    function(err, results) { cb(err, results) });
}

/*
 * A helper to read 3 tables for search endpoint
 *
 * @return JSON
 *
 */
var getRecommededStoresList = (buyer_id,limit,offset, cb) => { // buyer_id means = user_id
  const query = ` select DISTINCT ig_post.merchant_id as store_id , ig_post.tmb_img_url,
                    merchant.merchant_name, merchant.logo , ig_post.id as post_id,
                    pst_cnt.cnt,
                    (
                      case when ig_post.has_video is false
                      then 'IMAGE' else 'VIDEO' end
                    ) as type
                  from merchant_recommend
                  RIGHT JOIN ig_post on ig_post.merchant_id = merchant_recommend.recommended_merchant_id
                  inner join buyer_followed_merchant on  merchant_recommend.merchant_id = buyer_followed_merchant.merchant_id
                  inner join merchant on merchant.id =  merchant_recommend.merchant_id
                  inner join
                    (
                      select post_id ,count(post_id) as cnt
                      from ig_post_img where deleted_at is NULL  group by post_id
                    ) pst_cnt on ig_post.id = pst_cnt.post_id
                  where buyer_followed_merchant.buyer_id = ${buyer_id} and buyer_followed_merchant.deleted_at is null
                      and  merchant_recommend.recommended_merchant_id not in
                      (
                        select buyer_followed_merchant.merchant_id
                        from buyer_followed_merchant
                        where buyer_followed_merchant.buyer_id = ${buyer_id} and buyer_followed_merchant.deleted_at is null
                      )
                      and ig_post.deleted_at IS NULL
                  limit ${limit} offset ${offset} ;`;
  dbchernas
  .query(query, (error, results) => {
    cb(error, results);
  });


};

var get_fav_list = (buyer_id,limit,offset,cb) => {

  const query = `SELECT DISTINCT ig_post.merchant_id
    , ig_post.tmb_img_url
    , merchant.merchant_name
    , merchant.logo
    , ig_post.id AS post_id
    , pst_cnt.cnt
    , (CASE WHEN ig_post.has_video IS false THEN 'IMAGE' ELSE 'VIDEO' END) AS type
    , fav_list.created_on
    , CONCAT('http://chernas.mobyuat.asia/mobilepost_app.html?post_id=',ig_post.id) AS payment_url
    FROM fav_list
    INNER JOIN ig_post ON ig_post.id = fav_list.ig_post_id AND fav_list.merchant_id = ig_post.merchant_id
    INNER JOIN merchant ON merchant.id = ig_post.merchant_id
    INNER JOIN (SELECT post_id, COUNT(post_id) AS cnt FROM ig_post_img where deleted_at is NULL  GROUP BY post_id) pst_cnt ON ig_post.id = pst_cnt.post_id
    WHERE fav_list.user_id = ${buyer_id}
    AND ig_post.deleted_at IS NULL
    AND fav_list.fav_value IS true
    ORDER BY fav_list.created_on DESC
    LIMIT ${limit}
    OFFSET ${offset}`;

  dbchernas.query(query, function(err, rows) {
    cb(err, rows);
  });
}

var get_search_list = (cb) => {
  dbchernas
  .get('ig_post')
  .join('merchant', 'ig_post.merchant_id = merchant.id', 'LEFT')
  .join('buyer_followed_merchant', 'ig_post.merchant_id = buyer_followed_merchant.merchant_id', 'LEFT')
  .order_by('ig_post.post_date DESC')
  .get('ig_post', function(err, rows) {
    cb(err, rows);
  });
}

function create_or_insert_fb_user(data, cb) {
  db
  .where({ fb_id: data.fb_id })
  .get('users', function(err, rows) {
    if (err) {
      cb(err, rows);
    } else if(rows.length>0) {
      cb(err, {
        insertId: rows[0].id
      });
    } else {
      db.insert('users', {name: data.username,fb_id: data.fb_id}, function(err, info){
        info.first_time_user = true;
        cb(err, info);
      })
    }
  })
}


function get_merchant_status(data,cb) {
    dbchernas.select(['count(*) as cnt'])
        .where({"merchant_signup.merchant_id": data.id})
        .get('merchant_signup', function(err, rows) {
            cb(err, rows);
        })
}

/*
 * A helper to save data like merchant_id, dt_created, description in `gigi-chernas.ig_post` table
 *
 * @return JSON
 *
 */
var insertPostMultiImages = (params) => {
  dbchernas
    .insert('ig_post_img', {
      post_id: params.post_id,
      dest_s3_key: params.dest_s3_key,
      dest_s3_url: params.dest_s3_url,
      org_img_url: params.org_img_url,
      created_on: params.created_on
    });
};

/*
 * A helper to save data like merchant_id, dt_created, description in `gigi-chernas.ig_post` table
 *
 * @return JSON
 *
 */
var insertUploads = (requestedData, cb) => {
  dbchernas
    .where({
      tmb_img_url: requestedData.tmb_img_url
    })
    .get('ig_post', function (err, rows) {
      if (err) {
        cb(err, rows);
      } else if (rows.length > 0) {
        cb(err, {
          insertId: rows[0].id
        });
      } else {
        dbchernas
          .insert('ig_post', {
            description: requestedData.description,
            tmb_img_url: requestedData.tmb_img_url,
            post_url: requestedData.post_url,
            merchant_id: requestedData.merchant_id,
            price: requestedData.price,
            post_date: requestedData.post_date,
            sync_date: requestedData.sync_date,
            created_on: requestedData.created_on
          }, (err, info) => {
            cb(err, info);
            dbchernas.insert('ig_post_color_size', {
              post_id: info.insertId,
              free_size: (requestedData.free_size != null ? requestedData.free_size : 0),
              free_size_qty: requestedData.free_size_qty,
              color: (requestedData.color != null ? requestedData.color : '#000000'),
              xs: (requestedData.xs != null ? requestedData.xs : 0),
              s: (requestedData.s != null ? requestedData.s : 0),
              m: (requestedData.m != null ? requestedData.m : 0),
              l: (requestedData.l != null ? requestedData.l : 0),
              xl: (requestedData.xl != null ? requestedData.xl : 0),
              created_on: requestedData.created_on
            });
          });
      }
    });
};

/*
 * A child helper to save data like date_timeslot, datetime in `gigi-chernas.delivery_appointment` table
 *
 * @return void
 *
 */
const tableNamePrefix = {
  tables: ['orders', 'delivery_appointment']
};
var insertChildFirstTimeLogin = (params) => {
  dbchernas
    .insert(`${tableNamePrefix.tables[1]}`, {
      order_id: params.order_id,
      dt_date: params.dt_date,
      date_timeslot: params.date_timeslot,
      dt_created: params.dt_created,
      pickup_option_name: (params.pickup_option_name != null ? params.pickup_option_name : null),
      pickup_option_mobile_no: (params.pickup_option_mobile_no != null ? params.pickup_option_mobile_no : null)
    });
};

/*
 * A helper to save data like merchant_id, first_name, last_name in `gigi-chernas.orders` table
 *
 * @return {"status_code": 200}
 *
 */
var insertFirstTimeLogin = (requestedData, cb) => {
  dbchernas
    .where({
      first_name: requestedData.first_name
    })
    .get(`${tableNamePrefix.tables[0]}`, function(err, rows) {
      if (err) {
        cb(err, rows);
      } else if (rows.length > 0) {
        cb(err, {
          insertId: rows[0].id
        });
      } else {
        dbchernas.insert(`${tableNamePrefix.tables[0]}`, {
          merchant_id: requestedData.merchant_id,
          mobile: requestedData.mobile,
          first_name: requestedData.first_name,
          last_name: requestedData.last_name,
          address: requestedData.address,
          dt_created: requestedData.dt_created
        }, (err, info) => {
          cb(err, info);
        });
        insertChildFirstTimeLogin({
          order_id: requestedData.order_id,
          dt_date: requestedData.dt_date,
          dt_created: requestedData.dt_created,
          date_timeslot: requestedData.date_timeslot,
          pickup_option_name: requestedData.deliveryOptions.pickup_option_name,
          pickup_option_mobile_no: requestedData.deliveryOptions.pickup_option_mobile_no
        });
      }
    });
};

/*
 * A helper to save data like user_id, ig_post_id, fav_value in `gigi-chernas.fav_list` table
 *
 * @return {"status_code": 200}
 *
 */
var insertFav = (requestedData, cb) => {
  dbchernas
    .where({
      ig_post_id: requestedData.ig_post_id,
      merchant_id:requestedData.merchant_id
    })
    .get("fav_list", function (err, rows) {
      if (err) {
        cb(err, rows);
      } else if (rows.length > 0) {
          dbchernas
          .where({
              ig_post_id: requestedData.ig_post_id,
              merchant_id:requestedData.merchant_id
          })
           .update("fav_list", {fav_value : requestedData.fav_value , created_on : requestedData.created_on }, function (err) {
                 cb(err, {
                     insertId: rows[0].id
                 });
           });
           }
 else {
        dbchernas.insert("fav_list", {
          user_id: requestedData.user_id,
          ig_post_id: requestedData.ig_post_id,
          merchant_id:requestedData.merchant_id,
          post_date: requestedData.post_date,
          sync_date: requestedData.sync_date,
          created_on: requestedData.created_on,
          fav_value: requestedData.fav_value
        }, (err, info) => {
          cb(err, info);
        });
      }
    });
};

/*
 * A helper to read data like user_id, ig_post_id, fav_value in `gigi-chernas.fav_list` table
 *
 * @return JSON
 *
 */
var readFavListByUser = (conditions, cb) => {
  dbchernas
  .select(['fav_list.user_id', 'fav_list.ig_post_id', 'fav_value'])
  .where(conditions)
    .get('fav_list', (err, rows) => {
      cb(err, rows);
    });
};

function get_post_details(conditions, cb) {
    dbchernas.select(['ig_post.id'
        , 'ig_post.description'
        , 'ig_post.tmb_img_url as tmb_url'
        , 'ig_post.price'
        , 'ig_post.post_url'
        , 'merchant.merchant_name as store_name'
        , 'merchant.logo'
        , 'merchant.id as merchant_id'
        , '(case when IFNULL(fav_list.fav_value,0) = 1 then 1 else 0 end) as isFave'
        , " (case when merchant_signup.merchant_id is not null " +
          " then concat('http://chernas.mobyuat.asia/mobilepost_app.html?post_id=',ig_post.id) " +
          "  else null end) as payment_url "
        ,  " ( case when merchant_signup.merchant_id is null and lineat_id is null and fb_url is not null " +
           "  then replace(replace(fb_url,'https://www.facebook.com/',''),'/','')    " +
           "  when merchant_signup.merchant_id is null and  lineat_id is not null    " +
           "  then lineat_id                                                         " +
           "  when merchant_signup.merchant_id is null and lineat_id is  null and fb_url is  null " +
           "   then '@yiisaribas'    " +
           "  end ) as page_id       "
        ,   " ( case when merchant_signup.merchant_id is null and lineat_id is null and fb_url is not null  then 'FACEBOOK'    when merchant_signup.merchant_id is null and  fb_url is null   then 'LINE'     end ) as page_type  "
        ])
        .join('merchant', 'ig_post.merchant_id = merchant.id', 'LEFT')
        .join('fav_list', 'fav_list.ig_post_id = ig_post.id and ig_post.merchant_id = fav_list.merchant_id', 'LEFT')
        .join('merchant_signup' , 'merchant.id = merchant_signup.merchant_id','LEFT')
        .where({"ig_post.id": conditions.id, "ig_post.deleted_at": null})
        // .order_by(['ig_post.post_date desc', 'ig_post.sync_date desc'])
        .get('ig_post', function (err, rows) {
            cb(err, rows);
        });


}

function get_image_gallery(conditions, cb) {
    dbchernas.select(['ig_post_img.dest_s3_url as url'
        , "(case when dest_s3_url RLIKE '^.*\.(jpg|jpeg|png|gif|bmp)$' then 'Image' else 'Video' end ) as type"
    ])
        .where({"ig_post_img.post_id": conditions.id, "ig_post_img.deleted_at": null})
        // .order_by(['ig_post.post_date desc', 'ig_post.sync_date desc'])
        .get('ig_post_img', function (err, rows) {
            cb(err, rows);
        })
}


function get_stock(conditions, cb) {

    var query = "select color , 'Free Size' as size , IFNULL(free_size_qty,0) as qty from ig_post_color_size where post_id = product_id and free_size = 0 \n" +
        "  union\n" +
        "  select color, 'XS' as size, IFNULL(XS,0) as qty  from ig_post_color_size where post_id = product_id and XS > 0\n" +
        "  union\n" +
        "  select color, 'S' as size, IFNULL(S,0) as qty  from ig_post_color_size where post_id = product_id and s > 0\n" +
        "  union\n" +
        "  select color, 'M' as size, IFNULL(M,0) as qty  from ig_post_color_size where post_id = product_id and M > 0\n" +
        "  union\n" +
        "  select color, 'L' as size, IFNULL(L,0) as qty  from ig_post_color_size where post_id = product_id and L > 0\n" +
        "  union\n" +
        "  select color, 'XL' as size, IFNULL(XL,0) as qty  from ig_post_color_size where post_id = product_id and XL > 0\n";

    //query = query.replace('product_id',conditions.id);

    dbchernas.query(query.replace(/product_id/g, conditions.id), function (err, rows) {
        cb(err, rows);
    });
}

function getPaymentStatus(conditions,cb) {
    dbchernas.select(['payment_status_gb.resultCode as status'])
        .where(conditions)
        .order_by(['payment_status_gb.dt_created desc'])
        .limit(1)
        .get('payment_status_gb', function(err, rows) {
            cb(err, rows);
        })
}

function addOrder(cb) {
    dbchernas.insert('orders', {"dt_created" : 'now()'}, function(err, info) {
        cb(err, info);
    });
}

function get_user_by_ids(user_ids, cb) {
  db.where({id: user_ids})
    .get('users', function(err,rows){
      cb(err,rows);
    })
}


function get_stores_faved_by_friends(friend_id, cb) {
  dbchernas.query("SELECT ip.has_video, grouped_ig_post_img.count as gallery_count, grouped_ig_post_img.grouped_s3_urls, "+
    "mr.rank_no, merchant.id, merchant.merchant_name, merchant.logo, ip.id as ig_post_id, ip.tmb_img_url "+
    "from ig_post as ip "+
    "JOIN merchant on ip.merchant_id=merchant.id "+
    "JOIN merchant_ranks as mr on mr.merchant_id=merchant.id and mr.buyer_id="+friend_id+" "+
    "LEFT JOIN (SELECT count(*) as count, post_id, GROUP_CONCAT(dest_s3_url SEPARATOR ',') as "+
    "grouped_s3_urls from ig_post_img where deleted_at is NULL GROUP BY post_id) as grouped_ig_post_img on "+
    "ip.id=grouped_ig_post_img.post_id where ip.deleted_at IS NULL ORDER BY ip.post_date DESC", function(err, rows) {
      cb(err,rows)
    })
}

function get_products_faved_by_friends(user_id, cb) {
  const sql_query = `SELECT ip.has_video,
    grouped_ig_post_img.count AS gallery_count,
    grouped_ig_post_img.grouped_s3_urls,
    uf.friend_id,
    fl.ig_post_id AS ig_post_id,
    ip.post_url,
    ip.tmb_img_url
    FROM user_friends AS uf
    JOIN fav_list AS fl ON uf.friend_id = fl.user_id
    JOIN ig_post AS ip ON ip.id = fl.ig_post_id
    LEFT JOIN
    (SELECT COUNT(*) AS count,
    post_id,
    GROUP_CONCAT(dest_s3_url SEPARATOR ',') AS grouped_s3_urls
    FROM ig_post_img where deleted_at is NULL GROUP BY post_id) AS grouped_ig_post_img
    ON ip.id = grouped_ig_post_img.post_id
    WHERE ip.deleted_at IS NULL
      and uf.user_id = ${user_id}
      and fl.fav_value is TRUE
    ORDER BY fl.created_on DESC`;

  dbchernas.query(sql_query, function(err, rows) {
    cb(err,rows);
  });
}

function get_my_fave_products(user_id, cb) {
  const query = `SELECT ip.tmb_img_url AS thumb_image_url,
    ip.id AS product_id,
    merchant.logo AS logo,
    merchant.merchant_name AS store_name
    FROM fav_list AS fl
    JOIN ig_post AS ip ON ip.id = fl.ig_post_id
    JOIN merchant ON merchant.id = ip.merchant_id
    WHERE fl.user_id = ${user_id}
    AND ip.deleted_at IS NULL
    AND fl.fav_value = 1 ORDER BY fl.created_on
  `;

  dbchernas.query(query, function(err,rows){
    cb(err,rows);
  });
}

function get_all_stores_list(user_id, query, cb) {
  var sql = `Select gallery.grouped_s3_urls, gallery.count, merchant.id as merchant_id, merchant.merchant_name as merchant_name,
   merchant.logo,
   limited_products.id as product_id, limited_products.tmb_img_url as img_url,
   limited_products.has_video from (select id, tmb_img_url, has_video, merchant_id,
   @row_num := IF(@cmerchant = merchant_id,@row_num+1,1) AS row_num,@cmerchant := merchant_id
   from ig_post where ig_post.deleted_at IS NULL order by merchant_id asc, post_date desc) limited_products join merchant on
   merchant.id=limited_products.merchant_id
   join ( select post_id ,count(post_id) as count, GROUP_CONCAT(dest_s3_url SEPARATOR ',') as grouped_s3_urls
    from ig_post_img where deleted_at is NULL group by post_id
   ) gallery on limited_products.id = gallery.post_id
    where row_num<=20 and merchant.merchant_name LIKE "%${query || ""}%" and merchant.id NOT IN (select merchant_id from buyer_followed_merchant where buyer_id=${user_id})`
  dbchernas.query(sql, function (err, rows) {
      cb(err,rows);
    })
}

function get_followed_merchants_count(user_id, cb) {
  const query = `Select count(*) as count
                from buyer_followed_merchant
                where buyer_id= ${user_id} and buyer_followed_merchant.deleted_at is null;`;
  dbchernas.query(query, function(err, rows){
    cb(err, rows)
  })
}//Done for soft Delete

function follow_merchant(data, cb) {
  const { user_id, merchant_id } = data;

  dbchernas.where({buyer_id: user_id, merchant_id: merchant_id})
    .get('buyer_followed_merchant', function(err,rows){
      if (err || rows.length >=1 ) {
        cb(err);
      } else {
        let now = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
        dbchernas.insert('buyer_followed_merchant', { buyer_id: user_id, merchant_id: merchant_id , dt_created : now },
          function(err, info) {
            dbchernas.query('Select MAX(rank_no) as max_rank_no from merchant_ranks where buyer_id='+user_id+'', function(error, rows){
              if (error) {
                cb(error);
              } else {
                var timestampHelper = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
                if (rows.length==0) {
                  dbchernas.insert('merchant_ranks', {
                    merchant_id: merchant_id,
                    buyer_id: user_id,
                    rank_no: 1,
                    dt_created: timestampHelper
                  }, (insert_merchant_rank_error, info) => {
                    cb(insert_merchant_rank_error, info);
                  });
                } else {
                  dbchernas.insert('merchant_ranks', {
                    merchant_id: merchant_id,
                    buyer_id: user_id,
                    rank_no: rows[0].max_rank_no + 1,
                    dt_created: timestampHelper
                  }, (insert_merchant_rank_error, info) => {
                    cb(insert_merchant_rank_error, info);
                  });
                }
              }
            })
        });
      }
    })
}

function unfollow_merchant(data, cb) {
  const { user_id, merchant_id } = data;
  dbchernas
    .where({ buyer_id: user_id, merchant_id: merchant_id, deleted_at:null })
    .update('buyer_followed_merchant',{deleted_at: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")}, function(err) {
      if (err) {
        cb(err);
      } else {
        dbchernas
          .where({ buyer_id: user_id, merchant_id: merchant_id, deleted_at: null})
          .update('merchant_ranks', {deleted_at: moment(Date.now()).format("YYYY-MM-DD HH:mm:ss")},function(error) {
            if (error) {
              cb(error)
            } else {
              dbchernas
                .where({ buyer_id: user_id, deleted_at: null })
                .order_by('dt_created ASC')
                .get('merchant_ranks', function(error_retreiving_merchant_ranks, rows) {
                  if (error_retreiving_merchant_ranks) {
                    cb(error_retreiving_merchant_ranks);
                  } else {
                    rows.forEach(function(row, index){
                      dbchernas
                        .where({ id: row.id, deleted_at: null })
                        .update('merchant_ranks', { rank_no: index+1 }, function(error_while_updating, info){
                          if(error_while_updating) {
                            cb(error_while_updating);
                          }
                        })
                    })
                    cb();
                  }
                })
            }
          })
      }
    });
}// Done Soft Delete

function getUserProfile(user_id, cb) {
  const query = `SELECT mobile, name, id
    FROM users
    WHERE id = ${user_id};`;
  db.query(query, cb);
}

function getFollowedMerchants(user_id, cb) {
  const query = `SELECT *
    FROM buyer_followed_merchant
    WHERE buyer_id = ${user_id};`;
  dbchernas.query(query, cb);
}

function updateUserProfile(data, cb) {
    const { user_id, mobile, name } = data;
    db
      .where({ id: user_id })
      .get('users', (err, rows) => {
        if (err) {
          cb(err);
        } else if (rows.length) {
          db
            .where({ id: user_id })
            .update('users', { mobile, name }, cb);
        }
      });
}

function get_referral_code(buyer_id, cb){
  db.where({id: buyer_id})
    .get('users', function(err,rows){
      cb(err,rows);
    })
}

function add_referral_for_user(buyer_id, referral_code, cb){
  db.where({id: buyer_id})
  .update("users", {referral_code : referral_code}, function (err,rows) {
      cb(err, rows);
   });
}

function get_user_info_referral_code(referral_code, cb){
  db.select(['name','mobile','referral_code'])
  .where({referral_code: referral_code})
    .get('users', function(err,rows){
      cb(err,rows);
    })
}
function get_user_all_info_referral_code(referral_code, cb){
  db.where({referral_code: referral_code})
    .get('users', function(err,rows){
      cb(err,rows);
    })
}

function check_user_referral_status(invitee_id, inviter_id, cb){
  dbchernas
  .where({user_id: invitee_id, friend_id:inviter_id})
    .get('user_friends', function(err,rows){
      cb(err,rows);
    })
}

function add_referral_for_user_friend(invitee_id, inviter_id, cb){
  dbchernas.insert('user_friends', {user_id: invitee_id, friend_id:inviter_id}, function(err, info) {
    cb(err, info);
  });
}
function get_friends_ids(user_id, cb) {
  dbchernas.query("Select * from user_friends where user_id="+user_id, function(err, rows) {
    cb(err, rows);
  })
}

function get_users_by_ids(user_ids, cb) {
  db.where('id', user_ids)
    .get("users", function(err,rows) {
      cb(err, rows);
  })
}

function add_ig_detection(data,cb) {

  dbchernas
    .where({
      ig_id : data.ig_id
    })
    .get("ig_detection", function (err, rows) {

      if (err) {
        cb(err, rows);
      } else if (rows.length == 0) {
          dbchernas.query(`insert into ig_detection(ig_id,is_relevant,is_reviewed,buyer_id,dt_created)
                           values ('${data.ig_id}',TRUE,FALSE,${data.buyer_id},now())`, function(err,rows){
              cb(err,rows);
          });
      }
    });

}

function get_ig_detection(cb) {

  dbchernas
    .select(['ig_id'])
    .where({is_reviewed:false})
    .get("ig_detection", function (err, rows) {
        cb(err,rows);
    });

}

function update_ig_detection(data,cb) {
  dbchernas.query (`update ig_detection set is_relevant = ${data.is_relevant}
                                          , is_reviewed = ${data.is_reviewed}
                                          , dt_modified = now()
                   where ig_id = '${data.ig_id}' `, function(err,res){
                         cb(err,res);
                   })
}

function get_report_reasons(cb) {
  dbchernas.query("Select * from report_reasons", cb);
}

function report_product(obj,  cb) {
  dbchernas.insert('reported_entities', obj, cb);
}

function report_merchant(obj,  cb) {
  dbchernas.insert('reported_entities', obj, cb);
}

function add_merchant(data,cb) {

  dbchernas
    .where({
      ig_url : 'https://www.instagram.com/' + encodeURIComponent(data.ig_id) + '/'
    })
    .get("merchant", function (err, rows) {

      let scrap_time = moment(Date.now()).add(480, 'm').format("YYYY-MM-DD HH:mm:ss");

      if (err) {
        cb(err, rows);
      } else if (rows.length == 0) {

         let scrap_time = moment(Date.now()).add(480, 'm').format("YYYY-MM-DD HH:mm:ss");
         let ig_url = 'https://www.instagram.com/' + encodeURIComponent(data.ig_id) + '/';
         let merchant_name =  data.ig_id;
         dbchernas.query(` insert into merchant(merchant_name,upload_format,ig_url,sub_domain,aws_s3_bucket,next_scrap,ip_address_for_scrap,dt_created)
                           select '${merchant_name}','Excel', '${ig_url}' , '${merchant_name}','products-products','${scrap_time}',ip,now()
                           from ip_pool order by RAND() limit 1 `,cb);


      }
      else cb(err,{insertId : rows[0].id});
   });

}

function create_user(data, cb) {
  db
    .where(data)
    .get("users", function(err, info){
      if(err){
        cb(err)
      } else {
        if (info.length==0){
          db
            .insert('users', data, cb)
        } else {
          cb(null, info)
        }
      }
    })
}

function get_rec_store_list(data, cb) {
  var sql = ` Select distinct post_rank.count
     , merchant.id as merchant_id
     , post_rank.row_num
     , merchant.merchant_name as merchant_name
     , merchant.logo
     , post_rank.id as product_id
     , post_rank.tmb_img_url as img_url
     , case when ( post_rank.has_video is true or  post_rank.grouped_s3_urls RLIKE '^.*.(mp4).*$') then 'VIDEO' ELSE 'IMAGE' end type
  from (  select distinct recommended_merchant_id , merchant_ranks.rank_no
      from merchant_recommend
      inner join merchant_ranks  on merchant_ranks.merchant_id = merchant_recommend.merchant_id
      where merchant_ranks.buyer_id = ${data.user_id}
  order by merchant_ranks.rank_no asc
    ) recommend
  inner join merchant on merchant.id = recommend.recommended_merchant_id
  inner join ( select distinct id
              , tmb_img_url
              , has_video
              , ig_post.merchant_id
              , @row_num := IF(@cmerchant = ig_post.merchant_id,@row_num+1,1) AS row_num
              , @cmerchant := ig_post.merchant_id
              , gallery.count
              , gallery.grouped_s3_urls
              from ( select id,tmb_img_url,post_url,post_date,merchant_id,has_video,@ruw_num:=0,@cmerchant:=-12 from ig_post
      order by merchant_id,post_date desc ) ig_post
           inner join  ( select post_id ,count(post_id) as count, GROUP_CONCAT(dest_s3_url SEPARATOR ',') as grouped_s3_urls
                from ig_post_img group by post_id
            ) gallery on ig_post.id = gallery.post_id
    where merchant_id in
         ( select merchant_id from ig_post group by merchant_id HAVING count(id) > 7 )
  order by ig_post.merchant_id asc,row_num asc
           ) post_rank on merchant.id=post_rank.merchant_id
  where post_rank.row_num<= ${data.post_cnt}
  order by recommend.rank_no asc,merchant.id desc,post_rank.row_num ASC
  limit ${data.limit}
`;

  dbchernas.query(sql, function (err, rows) {
        cb(err,rows);
    });

}


function set_pin_to_top(data, cb) {

let sql = `update user_friends set pin_to_top = (
   case when friend_id = ${data.friend_id}
   then ${data.increment}
   when pin_to_top = ${data.max} then null
   when friend_id <> ${data.friend_id} and pin_to_top is not null
   then pin_to_top + ${data.increment}
    end )
 where user_id = ${data.user_id} `;

  dbchernas.query(sql,cb);

}

module.exports = {
  getNewList,
  getLatestMerchants,
  get_getinfo: get_getinfo,
  get_userAuth: get_userAuth,
  get_pastOrders: get_pastOrders,
  get_posts:get_posts,
  get_posts_cnt: get_posts_cnt,
  get_stores_list: get_stores_list,
  getPaymentStatus:getPaymentStatus,
  create_or_insert_fb_user: create_or_insert_fb_user,
  get_merchant_status:get_merchant_status,
  get_merchant_status:get_merchant_status,
  get_post_details:get_post_details,
  get_image_gallery:get_image_gallery,
  insertFirstTimeLogin: insertFirstTimeLogin,
  insertChildFirstTimeLogin: insertChildFirstTimeLogin,
  insertRankCounts: insertRankCounts,
  readRankCounts: readRankCounts,
  insertUploads: insertUploads,
  insertPostMultiImages: insertPostMultiImages,
  insertFav: insertFav,
  readFavListByUser: readFavListByUser,
  getRecommededStoresList: getRecommededStoresList,
  get_fav_list: get_fav_list,
  get_search_list: get_search_list,
  addOrder:addOrder,
  get_stores_faved_by_friends: get_stores_faved_by_friends,
  get_products_faved_by_friends: get_products_faved_by_friends,
  get_user_by_ids: get_user_by_ids,
  get_stock:get_stock,
  get_nine_grid_per_store:get_nine_grid_per_store,
  get_store_ids:get_store_ids,
  update_merchant_rank:update_merchant_rank,
  insert_merchant_rank:insert_merchant_rank,
  select_merchant_rank_fo_buyer:select_merchant_rank_fo_buyer,
  get_my_fave_products: get_my_fave_products,
  delete_merchant_rank_for_buyer:delete_merchant_rank_for_buyer,
  get_all_stores_list: get_all_stores_list,
  get_followed_merchants_count: get_followed_merchants_count,
  follow_merchant: follow_merchant,
  unfollow_merchant: unfollow_merchant,
  getUserProfile,
  updateUserProfile,
  getFollowedMerchants,
  get_referral_code:get_referral_code,
  add_referral_for_user:add_referral_for_user,
  get_user_info_referral_code:get_user_info_referral_code,
  get_user_all_info_referral_code:get_user_all_info_referral_code,
  check_user_referral_status:check_user_referral_status,
  add_referral_for_user_friend:add_referral_for_user_friend,
  get_friends_ids: get_friends_ids,
  get_users_by_ids: get_users_by_ids,
  add_posts_new_arrival:add_posts_new_arrival,
  add_ig_detection:add_ig_detection,
  get_ig_detection:get_ig_detection,
  update_ig_detection:update_ig_detection,
  get_report_reasons: get_report_reasons,
  report_product: report_product,
  report_merchant: report_merchant,
  login_log:login_log,
  add_merchant:add_merchant,
  create_user:create_user,
  get_rec_store_list:get_rec_store_list,
  set_pin_to_top:set_pin_to_top
}
