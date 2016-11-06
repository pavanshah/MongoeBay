var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/eBayDatabase";
var CronJob = require('cron').CronJob;
var url = require('url');
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = 'd6F3Efeq';

var winston = require('winston');
winston.add(winston.transports.File, { filename: 'public/EventLog.log' });
winston.remove(winston.transports.Console);

var advertisementdata = [];
var totalPrice = 0;
var biddingdata = [];
var cartdata = [];
var eBayHandle;
var LastLoginTime;

var amqp = require('amqp');
var connection = amqp.createConnection({host:'127.0.0.1'});
var rpc = new (require('../routes/amqprpc'))(connection);	//new object



//check credentials using passport
exports.checklogin = function(req,res,next)
{ 
	var json_responses;
	console.log("inside post request");
	
	passport.authenticate('login', function(err, results, info) {   	//callback done received
		console.log("inside authenticate "+results);

		if(!results) 
		{
			console.log("not a user");
			json_responses = {"statusCode" : 401};
			res.send(json_responses);
		}
		else
		{
			//userdata and session initialized
			req.session.username = results.userdata.username;	// This way subsequent requests will know the user is logged in
			req.session.firstname = results.userdata.firstname;
			eBayHandle = results.userdata.eBayHandle;
			console.log(req.session.username +" is the session");
			console.log("eBayHandle "+eBayHandle);
			LastLoginTime = results.userdata.LastLoginTime;
			console.log(LastLoginTime);
			
			//cart data and total price initialized
			cartdata = results.cartdata;
			totalPrice = results.totalPrice;
			
			//response sent to angular to load homepage
			json_responses = {"statusCode" : 200};
			res.send(json_responses);
		}	
  })(req, res, next);
};

//defining passport strategy
passport.use('login', new LocalStrategy(function(username, password, done) {
	
    	console.log("inside passport setup username "+username+" password "+password);
        
    	password = encrypt(password);
    	console.log("Signin password "+password);
    	
        var credentials = {
            username:username,
            password:password
        }
        
        process.nextTick(function(){
        	
        	rpc.makeRequest('login_queue',credentials, function(err,results){
        		
        		if(err){
        			throw err;
        		}
        		else 
        		{
        			if(results.code == 200)
        			{
        				console.log("success");
        				done(null, results, null);
        			}
        			else 
        			{    	
        				console.log("failure");
        				done(null, false, null);
        			}
        		}  
        	});
        
        });
}));

//Redirects to the homepage
exports.redirectToHomepage = function(req,res)
{
	if(req.session.username)
	{	
		var credentials = {"username" : req.session.username};
		
		//go to server to fetch advertisement and bidding data
		rpc.makeRequest('homepage_queue',credentials, function(err,results){
			
			if(err){
				throw err;
			}
			else 
			{
				if(results.code == 200)
				{
					console.log("success");
					console.log("advertisement data :"+results.advertisementdata);
					console.log("bidding data "+results.biddingdata);
					advertisementdata = results.advertisementdata;
					biddingdata = results.biddingdata;
					
					res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
					res.render("homepage2",{firstname:req.session.firstname, advertisementdata:advertisementdata, cartdata:cartdata, totalPrice:totalPrice, biddingdata:biddingdata, LastLoginTime:LastLoginTime});
					
				}
				else 
				{    	
					json_responses = {"statusCode" : 401};
					res.send(json_responses);
				}
			}  
		});
	}
	else
	{
		res.redirect('/');
	}
};


//Logout the user - invalidate the session
exports.logout = function(req,res)
{
	totalPrice = 0;
	cartdata = [];
	req.session.destroy();
	res.redirect('/');
};


//signup request
exports.checkSignup = function(req, res)
{
	var inputFirstName = req.param("inputFirstName");	// These two variables come from the form
	var inputLastName = req.param("inputLastName");
	var inputMobileNumber = req.param("inputMobileNumber");
	var inputDateOfBirth = req.param("inputDateOfBirth");
	var inputUsername = req.param("inputUsername");
	var inputPassword = req.param("inputPassword");
	var str = inputFirstName+inputLastName;
	eBayHandle = str.toLowerCase();
	console.log(eBayHandle);
	
	inputPassword = encrypt(inputPassword);
	console.log("Encrypted password - "+inputPassword);

	var credentials = {"inputFirstName" : inputFirstName, "inputLastName" : inputLastName, "inputMobileNumber" : inputMobileNumber, "inputDateOfBirth" : inputDateOfBirth, "inputUsername" : inputUsername, "inputPassword" : inputPassword, "eBayHandle" : eBayHandle};
	var json_responses;
	//go to server to register user
	rpc.makeRequest('signup_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
			{
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			}
			else 
			{    	
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		}  
	});
};



exports.addtocart = function(req, res)
{
	var matchflag = false;
	var itemname = req.param("itemname");
	var itemprice = req.param("itemprice");
	console.log("username "+req.session.username);
	var json_responses;
	
	for(var i = 0; i<cartdata.length;i++)
	{
		if(itemname == cartdata[i].itemname)
			{
				matchflag = true;
			}
	}
	
	console.log(matchflag);
	
	
	if(matchflag == true)
	{
		console.log("Duplicate Item");
		json_responses = {"statusCode" : 402};
		res.send(json_responses);
	}
	
	else
	{
		winston.info('User with email id '+req.session.username+' added '+itemname+' to cart');
	
		totalPrice = totalPrice + Number(itemprice);
		cartdata.push({'itemname':itemname, 'itemprice':itemprice});
	
		console.log("cartdata - "+cartdata);
		console.log("totalprice - "+totalPrice);
		
		var credentials = {"username" : req.session.username, "cartdata" : cartdata, "totalPrice" : totalPrice};
		
		//go to server to add item to cart
		rpc.makeRequest('addtocart_queue',credentials, function(err,results){
			
			if(err){
				throw err;
			}
			else 
			{
				if(results.code == 200)
				{
					json_responses = {"statusCode" : 200};
					res.send(json_responses);
				}
				else 
				{
					console.log("Error in adding cart data");
					json_responses = {"statusCode" : 401};
					res.send(json_responses);
				}
			}  
		});
	}
};


exports.deletefromcart = function(req, res)
{
	var itemname = req.param("itemname");
	var itemprice = req.param("itemprice");
	var json_responses;
	
	console.log("before deletion "+cartdata+totalPrice);
	
	totalPrice = totalPrice - itemprice;
	console.log(totalPrice);

	winston.info('User with email id '+req.session.username+' deleted '+itemname+' from cart');
	
	var credentials = {"username" : req.session.username, "cartdata" : cartdata, "totalPrice" : totalPrice, "itemname" : itemname};
	
	//go to server to delete item from cart
	rpc.makeRequest('deletefromcart_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
			{
				cartdata = results.cartdata;
				console.log("after deletion "+cartdata+totalPrice);
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			}
			else 
			{
				console.log("Error in deleting cart data");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		}  
	});
};


function myaccount(req, res)
{
	winston.info('User with email id '+req.session.username+' clicked on my account');
	
	console.log("eBayHandle "+eBayHandle)
	var credentials = {"eBayHandle" : eBayHandle};
	
	//go to server to provide account details
	rpc.makeRequest('myaccount_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
			{
				console.log("success");
				console.log(results)
				res.render("myaccount",{useradvertisementdetails : results.useradvertisementdetails, userdetails : results.userdetails, historydetails : results.historydetails});
			}
			else 
			{
				console.log("Error in account details");
			}
		}  
	});	
}


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
	
	console.log(itemname);
	winston.info('User with email id '+req.session.username+' added new advertisement for '+itemname);
	
	var json_responses;
	var credentials = {"itemname" : itemname, "itemdescription" : itemdescription, "itemprice" : itemprice, "username" : req.session.username, "eBayHandle" : eBayHandle};

	
	//go to server to add advertisement
	rpc.makeRequest('advertisement_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
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
		}  
	});	
};


exports.checkout = function(req, res)
{
	winston.info('User with email id '+req.session.username+' clicked on checkout');
	res.render("addresspage",{cartdata:cartdata, totalPrice:totalPrice});
};


exports.addBiddingAdvertisement = function(req, res)
{
	winston.remove(winston.transports.File, { filename: 'public/EventLog.log' });
	winston.add(winston.transports.File, { filename: 'public/BiddingLog.log' });
	
	
	var itemname = req.param("itemname");
	var itemdescription = req.param("itemdescription");
	var itemprice = req.param("itemprice");
	
	winston.info('User with email id '+req.session.username+' added bidding advertisement for '+itemname+" with initial price "+itemprice);
	
	var json_responses;
	var credentials = {"username" : req.session.username ,"itemname" : itemname, "itemdescription" : itemdescription, "itemprice" : itemprice};
		
	
	//go to server to add bidding advertisement
	rpc.makeRequest('biddingadvertisement_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
			{
				var datetoday = new Date();
				console.log(datetoday);
		//		datetoday.setDate(datetoday.getDate() + 4);
				
				datetoday.setSeconds(datetoday.getSeconds() + 60);
				console.log(datetoday);
				
				winston.info('Bidding item '+itemname+' will be sold on '+datetoday.getDate());
				
				var CronJob = require('cron').CronJob;
				var job = new CronJob(datetoday, function() 
				  {
						winston.info('Bidding item '+itemname+' ready for sell');
						sellitemafterbid(itemname, itemprice);
				  }, function () {
				    /* This function is executed when the job stops */
				  },
				  true,
				  'America/Los_Angeles'
				);
				
				winston.remove(winston.transports.File, { filename: 'public/BiddingLog.log' });
				winston.add(winston.transports.File, { filename: 'public/EventLog.log' });
				
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			}
			else 
			{
				console.log("Error in adding bidding advertisement");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		}  
	});	
		
};


function sellitemafterbid(itemname, itemprice)
{
	console.log("selling item "+itemname);
	winston.remove(winston.transports.File, { filename: 'public/EventLog.log' });
	winston.add(winston.transports.File, { filename: 'public/BiddingLog.log' });
	
	console.log("ready to sell "+itemname);
	
	var json_responses;
	var credentials = {"itemname" : itemname, "itemprice" : itemprice};
	
	//go to server to add advertisement
	rpc.makeRequest('sellafterbid_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
			{
				console.log("bidding item sold");
				
				winston.info("Bidding Item "+itemname+" has been sold to "+results.buyer);
				winston.remove(winston.transports.File, { filename: 'public/BiddingLog.log' });
				winston.add(winston.transports.File, { filename: 'public/EventLog.log' });
			}
			else 
			{
				console.log("Error in selling after bid");
			}
		}  
	});	
}


exports.changebidamount = function(req, res)
{
	console.log(req.param("itemname"));
	console.log(req.param("amount"));

	var itemname = req.param("itemname");
	var amount = req.param("amount");
	var json_responses;
	var credentials = {"itemname" : itemname, "amount" : amount, "buyer" : req.session.username};
	
	//go to server to add advertisement
	rpc.makeRequest('changebid_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
			{
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			}
			else 
			{
				console.log("Error in increasing bid");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		}  
	});	
	
};


exports.eBayHandle = function(req, res)
{
	console.log(req.params.username);
	eBayHandle = req.params.username;
	
	myaccount(req, res);
};


exports.paymentpage = function(req, res)
{
	res.render("paymentpage");
};


exports.success = function(req, res)
{
	var credentials = {"username" : req.session.username , "cartdata" : cartdata};
	
	//go to server to perform remaining activities
	rpc.makeRequest('order_queue',credentials, function(err,results){
		
		if(err){
			throw err;
		}
		else 
		{
			if(results.code == 200)
			{
				console.log("success");
				res.render("successpage");
			}
			else 
			{
				console.log("failure");
			}
		}  
	});	
	
};


//encrytption, decription using crypto
function encrypt(text)
{
	  var cipher = crypto.createCipher(algorithm,password);
	  var crypted = cipher.update(text,'utf8','hex');
	  crypted += cipher.final('hex');
	  return crypted;
}

function decrypt(text)
{
	  var decipher = crypto.createDecipher(algorithm,password);
	  var dec = decipher.update(text,'hex','utf8');
	  dec += decipher.final('utf8');
	  return dec;
}

function contactus(req, res)
{
	res.render("contactus");
}

exports.myaccount = myaccount;
exports.contactus = contactus;