var express = require('express')
, routes = require('./routes')
, user = require('./routes/user')
, http = require('http')
, path = require('path');
var url = require('url');
var passport = require('passport');

//URL for the sessions collections in mongoDB
var mongoSessionConnectURL = "mongodb://localhost:27017/eBayDatabase";
var expressSession = require("express-session");
var mongoStore = require("connect-mongo")(expressSession);
var mongo = require("./routes/mongo");
var main = require("./routes/main");
var client = require("./routes/client");

var app = express();

//all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(expressSession({
	secret: 'cmpe273_teststring',
	resave: false,  //don't save session if unmodified
	saveUninitialized: false,	// don't create session until something stored
	duration: 30 * 60 * 1000,    
	activeDuration: 5 * 60 * 1000,
	store: new mongoStore({
		url: mongoSessionConnectURL
	})
}));

app.use(app.router);
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, 'public')));

//development only
if ('development' === app.get('env')) {
	app.use(express.errorHandler());
}

//GET Requests
app.get('/', routes.index);
app.get('/users', user.list);
app.get('/homepage',client.redirectToHomepage);
app.get('/paymentpage', client.paymentpage);
app.get('/successpage', client.success);
app.get('/myaccount/:username', client.eBayHandle);

//POST Requests
app.post('/checklogin', client.checklogin);
app.post('/logout', client.logout);
app.post('/checkSignup', client.checkSignup);
app.post('/addtocart', client.addtocart);
app.post('/deletefromcart', client.deletefromcart);
app.post('/myaccount', client.myaccount);
app.post('/sellonebay', client.sellonebay);
app.post('/submitadvertisement', client.submitadvertisement);
app.post('/checkout', client.checkout);
app.post('/changebidamount', client.changebidamount);
app.post('/addBiddingAdvertisement', client.addBiddingAdvertisement);
app.post('/contactus', client.contactus);

//connect to the mongo collection session and then createServer
mongo.connect(mongoSessionConnectURL, function(){
	console.log('Connected to mongo at: ' + mongoSessionConnectURL);
	http.createServer(app).listen(app.get('port'), function(){
		console.log('Express server listening on port ' + app.get('port'));
	});  
});