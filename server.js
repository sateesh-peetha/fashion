require('dotenv/config');
require('dotenv').config({ path: `settings/${process.env.NODE_ENV}` });
var winston = require('winston');
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

global.logger = logger;
process.on('uncaughtException', function (err) {
  logger.log({
    level: 'error',
    time_stamp: Date.now(),
    message: err.message
  });
  console.log("Node NOT Exiting...", err);
});

var express = require('express');
var path = require('path');

const bodyParser = require('body-parser');

var cors = require('cors');
var swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('./api/swagger/swagger.json');

const app = express();

const port = 8080;

//API Links
var middleware = require('./middleware/middleware');
var login  = require('./routes/login');
var fb_login  = require('./routes/fb_login');
var insertFirstLogin = require('./routes/insertFirstLogin');
var insertRankCount = require('./routes/insertRankCount');
var upload = require('./routes/upload');
var get_fav_list = require('./routes/get_fav_list');
var readFav = require('./routes/readFav');
var insertFav = require('./routes/insertFav');
var get_search_list = require('./routes/get_search_list');
var getPastOrders  = require('./routes/getPastOrders');
var get_stores_list = require('./routes/get_stores_list');
var get_stores_list_nine_grid = require('./routes/get_stores_list_nine_grid');
//var getUserAuth  = require('./routes/getUserAuth');
var post = require('./routes/post');
var merchant_status  = require('./routes/merchantsignup');
var postDetail = require('./routes/getPost');
var gbpPaymentStatus = require('./routes/paymentStatus');
var addOrder              = require('./routes/addOrder');
var get_payment_methods = require('./routes/get_payment_methods');
var get_stores_faved_by_friends = require('./routes/get_stores_faved_by_friends');
var get_products_faved_by_friends = require('./routes/get_products_faved_by_friends');
var toggle_follow_merchant = require('./routes/toggle_follow_merchant');
var update_ranking = require('./routes/update_ranking');
var get_my_fave_products = require('./routes/get_my_fave_products');
var delete_ranking = require('./routes/delete_ranking');
var get_new_list = require('./routes/get_new_list');
var get_invite_link = require('./routes/Invite/get_invite_link');
var get_user_info_invite = require('./routes/Invite/get_user_info_invite');
var add_invite_acceptance = require('./routes/Invite/add_invite_acceptance');
var get_my_friends = require('./routes/get_my_friends');
var post_seen = require('./routes/post_seen');
var dectect_ig_id = require('./routes/detect_ig_id');
var report_merchant = require('./routes/report_entity/merchant');
var report_product = require('./routes/report_entity/product');
var report_reasons = require('./routes/report_entity/reasons');
var send_otp = require('./routes/sign_up/send_otp');
var verify_otp = require('./routes/sign_up/verify_otp');

const get_all_stores = require('./routes/stores/get_all_stores');
const get_followed_stores = require('./routes/stores/get_followed_stores');
const get_user_profile = require('./routes/user_profile/get_data');
const update_user_profile = require('./routes/user_profile/update_data');
const get_rec_stores = require('./routes/stores/get_recommended_stores');
const set_pin_to_top = require('./routes/set_pin_to_top');

app.use(express.static('assets'))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json({limit: '10mb'}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.get('/', function(req,res) {
  res.send("Server Started")
})

app.get("/api/get_store_details", get_stores_list_nine_grid);

//ROUTES
var router = express.Router();

router.post('/login', login.login);
router.post('/fb_login', fb_login);
router.post('/insert_first_login', insertFirstLogin.firstTimeLoginController);
router.get('/get_fav_list',middleware.middleware, get_fav_list);
router.get("/get_search_list", middleware.middleware ,get_search_list.getRecommededStoresListController);
router.get("/get_payment_methods", get_payment_methods);
router.get("/get_past_orders", getPastOrders.getPastOrders);
router.get("/get_stores_list", middleware.middleware, get_stores_list);//get_stores_list?buyer_id=1
router.post("/insert_rank_count", insertRankCount.insertRankCountController);
router.post('/upload', upload.uploadController);
router.post('/read_fav_list', readFav.readFavController);
router.post('/insert_fav_list', insertFav.insertFavController);
router.get('/get-post',middleware.middleware, post.getPost);
router.post('/post-seen',middleware.middleware, post_seen);
router.get('/get-merchant-status',merchant_status.getStatus);
router.get('/get-post-details',middleware.middleware ,postDetail.getPost);
router.get('/get-gbp-payment-status',gbpPaymentStatus.getPaymentStatus);
router.get('/get_stores_faved_by_friends', middleware.middleware, get_stores_faved_by_friends);
router.get('/get_products_faved_by_friends', middleware.middleware, get_products_faved_by_friends);
router.post('/add-order',addOrder.addOrder);
router.post('/toggle_follow_merchant', middleware.middleware, toggle_follow_merchant);
router.post('/rearrange_ranking', middleware.middleware, update_ranking.get_update_ranking);
router.get('/get_my_fave_products', middleware.middleware, get_my_fave_products);
router.delete('/delete_ranking', middleware.middleware, delete_ranking.delete_ranking);
router.get('/get_new_list',middleware.middleware, get_new_list);
router.get('/user_profile', middleware.middleware, get_user_profile);
router.put('/user_profile', middleware.middleware, update_user_profile);
router.get('/get_invite_link', middleware.middleware, get_invite_link);
router.get('/get_user_info_invite', middleware.middleware, get_user_info_invite);
router.post('/add_invite_acceptance', middleware.middleware, add_invite_acceptance);

router.get('/get_my_friends', middleware.middleware, get_my_friends);

router.post('/detect_ig_id',middleware.middleware,dectect_ig_id.detectIGID);

router.post('/report_merchant', middleware.middleware, report_merchant);
router.post('/report_product', middleware.middleware, report_product);
router.get('/report_reasons', middleware.middleware, report_reasons);

//Signup with phone number
router.post('/send_otp', send_otp);
router.post('/verify_otp', verify_otp);

//Store List routes
router.get('/stores',middleware.middleware, get_all_stores);
router.get('/followed_stores',middleware.middleware, get_followed_stores);
router.get('/recommended_stores',middleware.middleware, get_rec_stores);

router.post('/pin_to_top',middleware.middleware, set_pin_to_top);
//Middle ware  un comment this once required
//API Links
//router.get('/get_userAuth', getUserAuth.getUserAuth);
//router.get('/get_info', getinfo.getinfo);

app.use('/api',router);

//swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const server = app.listen(port, function() {
  const { address, port } = server.address();
  console.log('Listening at ', port);
})
