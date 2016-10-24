var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/eBayDatabase";

var winston = require('winston');
winston.add(winston.transports.File, { filename: 'public/EventLog.log' });
winston.remove(winston.transports.Console);

var advertisementdata = [];
var totalPrice = 0;
var cartdata = [];

function initialiseData(req, res)
{
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		var json_responses;
		
		coll.findOne({username: req.session.username}, function(err, user){	//retrive data
			if (user) 
			{
				cartdata = user.cartdata;
				totalPrice = user.totalprice;
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			} 
			
			else 
			{
				console.log("Error in cart data");
			}
		});
	});	
};

exports.checkLogin = function(req,res){
	
	var username = req.param("loginUsername");	// These two variables come from the form
	var password = req.param("loginPassword");
	console.log(password +" is the object");

	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		
		coll.findOne({username: username, password:password}, function(err, user){
			if (user) {
				req.session.username = user.username;	// This way subsequent requests will know the user is logged in
				req.session.firstname = user.firstname;
				console.log(req.session.username +" is the session");
				
				initialiseData(req, res);
			} 
			
			else {
				console.log("returned false");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		});
	});
};


function initialisecart(req, res, inputUsername)
{
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');
		var json_responses;
	
		coll.save({_id:inputUsername, username:inputUsername, cartdata : cartdata , totalprice : totalPrice}, function(err, user){
		if (user) {
			json_responses = {"statusCode" : 200};
			res.send(json_responses);

		} else {
			console.log("Error in adding cart data");
			json_responses = {"statusCode" : 401};
			res.send(json_responses);
		}
		});
	});
}

exports.checkSignup = function(req,res){
	
	var inputFirstName = req.param("inputFirstName");	// These two variables come from the form
	var inputLastName = req.param("inputLastName");
	var inputMobileNumber = req.param("inputMobileNumber");
	var inputDateOfBirth = req.param("inputDateOfBirth");
	var inputUsername = req.param("inputUsername");
	var inputPassword = req.param("inputPassword");

	var json_responses;

	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		
		coll.insert({firstname:inputFirstName, lastname:inputLastName, mobile:inputMobileNumber, dob:inputDateOfBirth, username:inputUsername, password:inputPassword}, function(err, user){
			if (user) {
				initialisecart(req, res, inputUsername);
			} else {
				console.log("Error in sign-up");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		});
	});
};


//Redirects to the homepage
exports.redirectToHomepage = function(req,res)
{
	if(req.session.username)
	{
		//find all advertisements
		mongo.connect(mongoURL, function(){
			console.log('Connected to mongo at: ' + mongoURL);
			var coll = mongo.collection('advertisementcollection');		//collection data in coll
			
			coll.find({},{}).toArray(function(err, user){	//retrive data
				if (user) 
				{
					advertisementdata = user;
					
					//Set these headers to notify the browser not to maintain any cache for the page being loaded
					res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
					res.render("homepage",{firstname:req.session.firstname, advertisementdata:advertisementdata, cartdata:cartdata, totalPrice:totalPrice});
				} 
				
				else 
				{
					console.log("Error in advertisement data");
				}
			})
		});
	}
	else
	{
		res.redirect('/');
	}
};


exports.addtocart = function(req, res)
{
	var itemname = req.param("itemname");
	var itemprice = req.param("itemprice");
	console.log(req.session.username);
	
	winston.info('User with email id '+req.session.username+' added '+itemname+' to cart');
	
	totalPrice = totalPrice + Number(itemprice);
	cartdata.push({'itemname':itemname, 'itemprice':itemprice});
	
	console.log("cartdata - "+cartdata);
	console.log("totalprice - "+totalPrice);
	
	
	var json_responses;

	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		
		coll.save({_id:req.session.username, username:req.session.username, cartdata : cartdata , totalprice : totalPrice}, function(err, user){
			if (user) {
				json_responses = {"statusCode" : 200};
				res.send(json_responses);

			} else {
				console.log("Error in adding cart data");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		});
	});
	
};


exports.deletefromcart = function(req, res)
{
	var itemname = req.param("itemname");
	var itemprice = req.param("itemprice");
	var json_responses;
	totalPrice = totalPrice - itemprice;
	console.log(totalPrice);

	winston.info('User with email id '+req.session.username+' deleted '+itemname+' from cart');
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		
		coll.update({_id : req.session.username}, {$pull : {cartdata : {itemname : itemname} }, $set : {totalprice : totalPrice} } , function(err, user){
			if (user) {
				updatecartafterdeletion(req, res);
			} else {
				console.log("Error in deleting cart data");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		});
	});
};

function updatecartafterdeletion(req, res)
{
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		var json_responses;
		
		coll.findOne({username: req.session.username}, function(err, user){	//retrive data
			if (user) 
			{
				cartdata = user.cartdata;
				console.log(user.totalprice);
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			} 
			
			else 
			{
				console.log("Error in retriving cart data");
			}
		});
	});	
}


function finduseradvertisements(req, res, userdetails)
{
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		coll.find({username : req.session.username}).toArray(function(err, user){	//retrive data
			if (user) 
			{
				var useradvertisementdetails = user;
				
				res.render("myaccount",{useradvertisementdetails : useradvertisementdetails, userdetails : userdetails});
			} 
			
			else 
			{
				console.log("Error in advertisement data");
			}
		})
	});
}

exports.myaccount = function(req, res)
{
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		var json_responses;
		
		winston.info('User with email id '+req.session.username+' clicked on my account');
		
		coll.findOne({username: req.session.username}, function(err, user){	//retrive data
			if (user) 
			{
				var userdetails = user;
				finduseradvertisements(req, res, userdetails);
			} 
			
			else 
			{
				console.log("Error in retriving cart data");
			}
		});
	});	
	
};

exports.sellonebay = function(req,res)
{
	winston.info('User with email id '+req.session.username+' clicked on sell on ebay');
	res.render("sellonebay");
}

exports.submitadvertisement = function(req,res)
{
	var itemname = req.param("itemname");
	var itemdescription = req.param("itemdescription");
	var itemprice = req.param("itemprice");
	
	winston.info('User with email id '+req.session.username+' added new advertisement for '+itemname);
	
	var json_responses;

	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		coll.insert({itemname : itemname, itemdescription : itemdescription, itemprice : itemprice, username : req.session.username}, function(err, user){
			if (user) 
			{
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			} 
			else 
			{
				console.log("Error in submitting advertisement");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		});
	});
	
};


exports.checkout = function(req, res)
{
	winston.info('User with email id '+req.session.username+' clicked on checkout');
	res.render("paymentpage",{cartdata:cartdata, totalPrice:totalPrice});
};

//Logout the user - invalidate the session
exports.logout = function(req,res)
{
	totalPrice = 0;
	cartdata = [];
	req.session.destroy();
	res.redirect('/');
};


exports.finduseradvertisements = finduseradvertisements;
exports.updatecartafterdeletion = updatecartafterdeletion;
exports.initialiseData = initialiseData;
exports.initialisecart = initialisecart;