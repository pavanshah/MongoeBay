var mongo = require("./mongo");
var mongoURL = "mongodb://localhost:27017/eBayDatabase";
var CronJob = require('cron').CronJob;
var url = require('url');

//var winston = require('winston');
//winston.add(winston.transports.File, { filename: 'public/EventLog.log' });
//winston.remove(winston.transports.Console);

var advertisementdata = [];
var totalPrice = 0;
var biddingdata = [];
var cartdata = [];
var eBayHandle;
var LastLoginTime;


function saveLogintime(req, res)
{
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		var json_responses;
		
		var Logintime = new Date();
		console.log(Logintime);
		var minutes = Logintime.getMinutes().toString().length == 1 ? '0'+Logintime.getMinutes() : Logintime.getMinutes();
		var	hours = Logintime.getHours().toString().length == 1 ? '0'+Logintime.getHours() : Logintime.getHours();
		var	ampm = Logintime.getHours() >= 12 ? 'pm' : 'am';
		var	months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var	days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		Logintime = days[Logintime.getDay()]+' '+months[Logintime.getMonth()]+' '+Logintime.getDate()+' '+Logintime.getFullYear()+' '+hours+':'+minutes+ampm;
		
		
		
		coll.update({username: req.session.username}, {$set : {LastLoginTime : Logintime }}, function(err, user){
			if (user) 
			{
				json_responses = {"statusCode" : 200};
				res.send(json_responses);
			} else 
			{
				console.log("Error in login time");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		});
	});
	
}

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
				saveLogintime(req, res);
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
				eBayHandle = user.eBayHandle;
				LastLoginTime = user.LastLoginTime;
				console.log(LastLoginTime);
				
				console.log(req.session.username +" is the session");
				console.log("eBayHandle "+eBayHandle);
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


function initialiseuseritemsdata(req, res, inputUsername)
{
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');
		var json_responses;
	
		coll.save({_id:inputUsername, username:inputUsername, useritems : [], eBayHandle : eBayHandle}, function(err, user){
		if (user) 
		{
			json_responses = {"statusCode" : 200};
			res.send(json_responses);

		} else {
			console.log("Error in creating useritem data");
			json_responses = {"statusCode" : 401};
			res.send(json_responses);
		}
		});
	});
}

function initialisecart(req, res, inputUsername)
{
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');
		var json_responses;
	
		coll.save({_id:inputUsername, username:inputUsername, cartdata : cartdata , totalprice : totalPrice}, function(err, user){
		if (user) 
		{
			initialiseuseritemsdata(req, res, inputUsername);

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
	var str = inputFirstName+inputLastName;
	eBayHandle = str.toLowerCase();
	console.log(eBayHandle);
	
	var json_responses;
	var Logintime = new Date();
	var NewLoginTime = Logintime.getDate()+" "+Logintime.getTime();
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		
		coll.insert({firstname:inputFirstName, lastname:inputLastName, mobile:inputMobileNumber, dob:inputDateOfBirth, username:inputUsername, password:inputPassword, eBayHandle:eBayHandle, LastLoginTime : NewLoginTime}, function(err, user){
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


function fetchbiddingdata(req, res)
{
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
		
		coll.find({},{}).toArray(function(err, user){	//retrive data
			if (user) 
			{
				biddingdata = user;
				console.log(biddingdata)
				//Set these headers to notify the browser not to maintain any cache for the page being loaded
				res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
				res.render("homepage",{firstname:req.session.firstname, advertisementdata:advertisementdata, cartdata:cartdata, totalPrice:totalPrice, biddingdata:biddingdata, LastLoginTime:LastLoginTime});
			} 
			
			else 
			{
				console.log("Error in advertisement data");
			}
		})
	});
}

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
					fetchbiddingdata(req, res);
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
	var matchflag = false;
	var itemname = req.param("itemname");
	var itemprice = req.param("itemprice");
	console.log(req.session.username);
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
	}
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


function finduserhistory(req, res, userdetails, useradvertisementdetails)
{
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');		//collection data in coll
		
		coll.findOne({eBayHandle : eBayHandle}, function(err, user){	//retrive data
			if (user) 
			{
				var historydetails = user.useritems;
				res.render("myaccount",{useradvertisementdetails : useradvertisementdetails, userdetails : userdetails, historydetails : historydetails});
			} 
			
			else 
			{
				console.log("Error in history data");
			}
		})
	});
	
}

function finduseradvertisements(req, res, userdetails)
{
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		coll.find({eBayHandle : eBayHandle}).toArray(function(err, user){	//retrive data
			if (user) 
			{
				var useradvertisementdetails = user;
				
				finduserhistory(req, res, userdetails, useradvertisementdetails)
				
			} 
			
			else 
			{
				console.log("Error in advertisement data");
			}
		})
	});
}

function myaccount(req, res)
{
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		var json_responses;
		
		winston.info('User with email id '+req.session.username+' clicked on my account');
		
		coll.findOne({eBayHandle: eBayHandle}, function(err, user){	//retrive data
			if (user) 
			{
				var userdetails = user;
				console.log(userdetails);
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
		
		coll.insert({itemname : itemname, itemdescription : itemdescription, itemprice : itemprice, username : req.session.username, eBayHandle : eBayHandle}, function(err, user){
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
	res.render("addresspage",{cartdata:cartdata, totalPrice:totalPrice});
};


exports.paymentpage = function(req, res)
{
	res.render("paymentpage");
};

exports.success = function(req, res)
{
	res.render("successpage");
	
	//add to user items
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');		//collection data in coll
		
		for(var i=0; i< cartdata.length; i++)
		{
		
			coll.update({username : req.session.username}, {$push : {useritems : cartdata[i]} } , function(err, user){
				if (user) 
				{
					console.log("account updated");
				} 
				else 
				{
					console.log("Error in adding to user account");
				}
			});	
		}
	});
	
	
	//delete advertisement
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		for(var j=0; j< cartdata.length; j++)
		{
		
			coll.remove({itemname : cartdata[j].itemname} , function(err, user){
				if (user) 
				{
					console.log("deleted advertisement");
				} 
				else 
				{
					console.log("Error in deleting");
				}
			});	
		}
	});
	
	//delete from cartdata
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
	
			coll.update({username : req.session.username}, {$set : {cartdata : [], totalprice : 0 }} , function(err, user){
				if (user) 
				{
					console.log("cartdata updated");
				} 
				else 
				{
					console.log("Error in updating cartdata");
				}
			});	
	});
}


exports.changebidamount = function(req, res)
{
	console.log(req.param("itemname"));
	console.log(req.param("amount"));

	var itemname = req.param("itemname");
	var amount = req.param("amount");
	var json_responses;
	//update bid amount
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
	
			coll.update({itemname : itemname}, {$set : {itemprice : amount, buyer : req.session.username}} , function(err, user){
				if (user) 
				{
					console.log("bid amount updated");
					json_responses = {"statusCode" : 200};
					res.send(json_responses);
				} 
				else 
				{
					console.log("Error in updating bid amount");
					json_responses = {"statusCode" : 401};
					res.send(json_responses);
				}
			});	
	});
};


function deletefrombiddingadvertisements(itemname)
{
	//delete advertisement
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
		
			coll.remove({itemname : itemname} , function(err, user){
				if (user) 
				{
					console.log("deleted advertisement");
				} 
				else 
				{
					console.log("Error in deleting");
				}
			});	
	});
	
}

function addbiditemtouseraccount(buyer, itemname, itemprice)
{
	console.log("adding item");
	
	
	//add to user items
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');		//collection data in coll
		
			coll.update({username : buyer}, {$push : {useritems : {itemname : itemname, itemprice : itemprice} } } , function(err, user){
				if (user) 
				{
					console.log("account updated");
					deletefrombiddingadvertisements(itemname);
				} 
				else 
				{
					console.log("Error in adding to user account");
				}
			});	
	});
	
	
}

function sellitemafterbid(itemname, itemprice)
{
	winston.remove(winston.transports.File, { filename: 'public/EventLog.log' });
	winston.add(winston.transports.File, { filename: 'public/BiddingLog.log' });
	
	console.log("ready to sell "+itemname);
	
	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
	
			coll.findOne({itemname : itemname} , function(err, user){
				if (user) 
				{
					var buyer = user.buyer;
					console.log("buyer "+user.buyer);
					
					winston.info("Bidding Item "+itemname+" has been sold to "+buyer);
					
					winston.remove(winston.transports.File, { filename: 'public/BiddingLog.log' });
					winston.add(winston.transports.File, { filename: 'public/EventLog.log' });
					
					addbiditemtouseraccount(buyer, itemname, itemprice);
				} 
				else 
				{
					console.log("Error in removing item");
				}
			});	
	});
}

exports.addBiddingAdvertisement = function(req, res)
{
	winston.remove(winston.transports.File, { filename: 'public/EventLog.log' });
	winston.add(winston.transports.File, { filename: 'public/BiddingLog.log' });
	
	
	var itemname = req.param("itemname");
	var itemdescription = req.param("itemdescription");
	var itemprice = req.param("itemprice");
	
	winston.info('User with email id '+req.session.username+' added bidding advertisement for '+itemname+" with initial price "+itemprice);
	
	var json_responses;

	mongo.connect(mongoURL, function(){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
		
		coll.insert({username:req.session.username, itemname:itemname, itemdescription:itemdescription, itemprice:itemprice, buyer:req.session.username}, function(err, user){
			if (user) 
			{
				var datetoday = new Date();
				console.log(datetoday);
				datetoday.setDate(datetoday.getDate() + 4);
				
		//		datetoday.setSeconds(datetoday.getSeconds() + 60);
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
				
			} else {
				console.log("Error in adding bid");
				json_responses = {"statusCode" : 401};
				res.send(json_responses);
			}
		});
	});
};

exports.eBayHandle = function(req, res)
{
	console.log(req.params.username);
	eBayHandle = req.params.username;
	
	myaccount(req, res);
};


//Logout the user - invalidate the session
exports.logout = function(req,res)
{
	totalPrice = 0;
	cartdata = [];
	req.session.destroy();
	res.redirect('/');
};

exports.myaccount = myaccount;
exports.fetchbiddingdata = fetchbiddingdata;
exports.finduserhistory = finduserhistory;
exports.initialiseuseritemsdata = initialiseuseritemsdata;
exports.finduseradvertisements = finduseradvertisements;
exports.updatecartafterdeletion = updatecartafterdeletion;
exports.initialiseData = initialiseData;
exports.initialisecart = initialisecart;