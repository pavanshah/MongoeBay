var mongo = require("../services/mongo");
var mongoURL = "mongodb://localhost:27017/eBayDatabase";
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

//-----------------------------------------------------------------------------------------------
function handle_loginrequest(msg, callback){
	
	var res = {};
	console.log("In handle request:"+ msg.username);
	
	mongo.connect(mongoURL, function(connection){
		console.log("connection received "+connection);
		
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		
		coll.findOne({username: msg.username, password:msg.password}, function(err, user){
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.code = "200";
				res.userdata = user;
			
				initialiseData(msg, callback, res);
			} 
			
			else 
			{
				res.code = "401";
				callback(null, res);
			}
		});
	});
}

function initialiseData(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		
		coll.findOne({username: msg.username}, function(err, user){	//retrive data
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.cartdata = user.cartdata;
				res.totalPrice = user.totalprice;
				saveLogintime(msg, callback, res);
			}
			
			else 
			{
				console.log("Error in cart data");
			}
		});
	});	
};

function saveLogintime(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		
		var Logintime = new Date();
		console.log(Logintime);
		var minutes = Logintime.getMinutes().toString().length == 1 ? '0'+Logintime.getMinutes() : Logintime.getMinutes();
		var	hours = Logintime.getHours().toString().length == 1 ? '0'+Logintime.getHours() : Logintime.getHours();
		var	ampm = Logintime.getHours() >= 12 ? 'pm' : 'am';
		var	months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var	days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		Logintime = days[Logintime.getDay()]+' '+months[Logintime.getMonth()]+' '+Logintime.getDate()+' '+Logintime.getFullYear()+' '+hours+':'+minutes+ampm;
		
		
		coll.update({username: msg.username}, {$set : {LastLoginTime : Logintime }}, function(err, user){
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				console.log("res "+res);
				callback(null, res);
			} 
			
			else 
			{
				console.log("Error in login time");
			}
		});
	});	
}
//----------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------
function handle_homepagerequest(msg, callback)
{
	var res = {};
	
	console.log("homepage username "+msg.username);
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		coll.find({},{}).toArray(function(err, user){	//retrive data
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.advertisementdata = user;
				fetchbiddingdata(msg, callback, res);
			} 
			
			else 
			{
				res.code = "401";
				console.log("Error in advertisement data");
			}
		});
	});
}


function fetchbiddingdata(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
		
		coll.find({},{}).toArray(function(err, user){	//retrive data
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.code = "200";
				res.biddingdata = user;
				callback(null, res);
			} 
			
			else 
			{
				console.log("Error in bidding data");
			}
		})
	});
}
//---------------------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------------
function handle_signuprequest(msg, callback)
{
	var res = {};
	console.log("credentials "+msg.inputUsername);
	
	var Logintime = new Date();
	console.log(Logintime);
	var minutes = Logintime.getMinutes().toString().length == 1 ? '0'+Logintime.getMinutes() : Logintime.getMinutes();
	var	hours = Logintime.getHours().toString().length == 1 ? '0'+Logintime.getHours() : Logintime.getHours();
	var	ampm = Logintime.getHours() >= 12 ? 'pm' : 'am';
	var	months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	var	days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
	var NewLoginTime = days[Logintime.getDay()]+' '+months[Logintime.getMonth()]+' '+Logintime.getDate()+' '+Logintime.getFullYear()+' '+hours+':'+minutes+ampm;
	console.log(NewLoginTime);
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');
		
		coll.insert({firstname:msg.inputFirstName, lastname:msg.inputLastName, mobile:msg.inputMobileNumber, dob:msg.inputDateOfBirth, username:msg.inputUsername, password:msg.inputPassword, eBayHandle:msg.eBayHandle, LastLoginTime : NewLoginTime}, function(err, user){
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				initialisecart(msg, callback, res);
			} 
			else 
			{
				res.code = "401";
				console.log("Error in signup");
				callback(null, res);
			}
		});
	});
}


function initialisecart(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');
	
		coll.save({_id:msg.inputUsername, username:msg.inputUsername, cartdata : [] , totalprice : 0}, function(err, user){
		
		console.log("connection returned "+connection);
		mongo.returnConnection(connection);
			
		if (user) 
		{
			initialiseuseritemsdata(msg, callback, res);

		} else 
		{
			console.log("Error in initialising cart data");
			res.code = "401";
			callback(null, res);
		}
		});
	});
}


function initialiseuseritemsdata(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');
	
		coll.save({_id:msg.inputUsername, username:msg.inputUsername, useritems : [], eBayHandle : msg.eBayHandle}, function(err, user){
		
		console.log("connection returned "+connection);
		mongo.returnConnection(connection);
			
		if (user) 
		{
			res.code = "200";
			callback(null, res);

		} else {
			console.log("Error in initializing useritems data");
			res.code = "401";
			callback(null, res);
		}
		});
	});
}
//---------------------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------------
function handle_addtocartrequest(msg, callback)
{
	var res = {};
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		
		coll.save({_id:msg.username, username:msg.username, cartdata : msg.cartdata , totalprice : msg.totalPrice}, function(err, user){
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.code = "200";
				callback(null, res);
			} 
			else 
			{
				console.log("Error in adding cart data");
				res.code = "401";
				callback(null, res);
			}
			});
		});
}
//---------------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------
function handle_deletefromcartrequest(msg, callback)
{
	var res = {};
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		
		coll.update({_id : msg.username}, {$pull : {cartdata : {itemname : msg.itemname} }, $set : {totalprice : msg.totalPrice} } , function(err, user){
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				updatecartafterdeletion(msg, callback, res);
			} 
			else 
			{
				console.log("Error in deleting cart data");
				res.code = "401";
				callback(null, res);
			}
		});
	});
}

function updatecartafterdeletion(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
		
		coll.findOne({username: msg.username}, function(err, user){	//retrive data
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.cartdata = user.cartdata;
				res.code = "200";
				callback(null, res);
			} 
			
			else 
			{
				console.log("Error in updating cart data");
			}
		});
	});	
}

//-----------------------------------------------------------------------------------------------


//-----------------------------------------------------------------------------------------------
function handle_myaccountrequest(msg, callback)
{
	var res = {};
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('usercollection');		//collection data in coll
		
		coll.findOne({eBayHandle: msg.eBayHandle}, function(err, user){	//retrive data
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.userdetails = user;
				finduseradvertisements(msg, callback, res);
			} 
			
			else 
			{
				console.log("Error in account data");
				res.code = "401";
				callback(null, res);
			}
		});
	});
}


function finduseradvertisements(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		coll.find({eBayHandle : msg.eBayHandle}).toArray(function(err, user){	//retrive data
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.useradvertisementdetails = user;
				finduserhistory(msg, callback, res);
			} 
			
			else 
			{
				console.log("Error in user advertisement data");
				res.code = "401";
				callback(null, res);
			}
		});
	});
}


function finduserhistory(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');		//collection data in coll
		
		coll.findOne({eBayHandle : msg.eBayHandle}, function(err, user){	//retrive data
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.historydetails = user.useritems;
				res.code = "200";
				callback(null, res);
			} 
			
			else 
			{
				console.log("Error in history data");
				res.code = "401";
				callback(null, res);
			}
		})
	});
}


function handle_addadvertisementrequest(msg, callback)
{
	var res = {};
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		coll.insert({itemname : msg.itemname, itemdescription : msg.itemdescription, itemprice : msg.itemprice, username : msg.username, eBayHandle : msg.eBayHandle}, function(err, user){
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.code = "200";
				callback(null, res);
			} 
			else 
			{
				console.log("Error in adding advertisement");
				res.code = "401";
				callback(null, res);
			}
		});
	});	
}


function handle_addbiddingadvertisementrequest(msg, callback)
{
	var res = {};
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
		
		coll.insert({username:msg.username, itemname:msg.itemname, itemdescription:msg.itemdescription, itemprice:msg.itemprice, buyer:msg.username}, function(err, user){
			
			console.log("connection returned "+connection);
			mongo.returnConnection(connection);
			
			if (user) 
			{
				res.code = "200";
				callback(null, res);
			} 
			else 
			{
				console.log("Error in adding bid");
				res.code = "401";
				callback(null, res);
			}
		});
	});
}


//------------------------------------------------------------------------------------------
function handle_sellafterbidrequest(msg, callback)
{
	var res = {};	
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');
	
			coll.findOne({itemname : msg.itemname} , function(err, user){
				
				console.log("connection returned "+connection);
				mongo.returnConnection(connection);
				
				if (user) 
				{
					res.buyer = user.buyer;
					console.log("buyer "+user.buyer);
					addbiditemtouseraccount(msg, callback, res);
				} 
				else 
				{
					console.log("Error in removing item");
					res.code = "401";
					callback(null, res);
				}
			});	
	});
}


function addbiditemtouseraccount(msg, callback, res)
{
	console.log("adding to user account");
	
	//add to user items
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');		//collection data in coll
		
			coll.update({username : res.buyer}, {$push : {useritems : {itemname : msg.itemname, itemprice : msg.itemprice} } } , function(err, user){
				
				console.log("connection returned "+connection);
				mongo.returnConnection(connection);
				
				if (user) 
				{
					console.log("account updated");
					deletefrombiddingadvertisements(msg, callback, res);
				} 
				else 
				{
					console.log("Error in adding to user account");
					res.code = "401";
					callback(null, res);
				}
			});	
	});
}


function deletefrombiddingadvertisements(msg, callback, res)
{
	//delete advertisement
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
		
			coll.remove({itemname : msg.itemname} , function(err, user){
				
				console.log("connection returned "+connection);
				mongo.returnConnection(connection);
				
				if (user) 
				{
					console.log("deleted advertisement");
					res.code = "200";
					callback(null, res);
				} 
				else 
				{
					console.log("Error in deleting");
					res.code = "401";
					callback(null, res);
				}
			});	
	});
}
//----------------------------------------------------------------------------------------------


function handle_changebidrequest(msg, callback)
{
	var res = {};
	
	//update bid amount
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('biddingcollection');		//collection data in coll
	
			coll.update({itemname : msg.itemname}, {$set : {itemprice : msg.amount, buyer : msg.buyer}} , function(err, user){
				
				console.log("connection returned "+connection);
				mongo.returnConnection(connection);
				
				if (user) 
				{
					console.log("bid amount updated");
					res.code = "200";
					callback(null, res);
				} 
				else 
				{
					console.log("Error in updating bid amount");
					res.code = "401";
					callback(null, res);
				}
			});	
	});
}

//------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------
//add to user items
function handle_orderrequest(msg, callback)
{
	var res = {};
	
	console.log(msg);
	
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('useritemcollection');		//collection data in coll
		
		for(var i=0; i< msg.cartdata.length; i++)
		{
		
			coll.update({username : msg.username}, {$push : {useritems : msg.cartdata[i]} } , function(err, user){
				
				console.log("connection returned "+connection);
				mongo.returnConnection(connection);
				
				if (user) 
				{
					console.log("account updated");
					deleteAdvertisement(msg, callback, res);
				} 
				else 
				{
					console.log("Error in adding to user account");
					res.code = "401";
					callback(null, res);
				}
			});	
		}
	});
}
	
//delete advertisement
function deleteAdvertisement(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('advertisementcollection');		//collection data in coll
		
		for(var j=0; j< msg.cartdata.length; j++)
		{
		
			coll.remove({itemname : msg.cartdata[j].itemname} , function(err, user){
				console.log("connection returned "+connection);
				mongo.returnConnection(connection);
				
				if (user) 
				{
					console.log("deleted advertisement");
					deleteFromCartdata(msg, callback, res);
				} 
				else 
				{
					console.log("Error in deleting");
					res.code = "401";
					callback(null, res);
				}
			});	
		}
	});
}
	
	//delete from cartdata
function deleteFromCartdata(msg, callback, res)
{
	mongo.connect(mongoURL, function(connection){
		console.log('Connected to mongo at: ' + mongoURL);
		var coll = mongo.collection('cartcollection');		//collection data in coll
	
			coll.update({username : msg.username}, {$set : {cartdata : [], totalprice : 0 }} , function(err, user){
				
				console.log("connection returned "+connection);
				mongo.returnConnection(connection);
				
				if (user) 
				{
					console.log("cartdata updated");
					res.code = "200";
					callback(null, res);
				} 
				else 
				{
					console.log("Error in updating cartdata");
					res.code = "401";
					callback(null, res);
				}
			});	
	});
}

//--------------------------------------------------------------------------------------------

exports.handle_loginrequest = handle_loginrequest;
exports.handle_homepagerequest = handle_homepagerequest;
exports.handle_signuprequest = handle_signuprequest;
exports.handle_addtocartrequest = handle_addtocartrequest;
exports.handle_deletefromcartrequest = handle_deletefromcartrequest;
exports.handle_myaccountrequest = handle_myaccountrequest;
exports.handle_addadvertisementrequest = handle_addadvertisementrequest;
exports.handle_addbiddingadvertisementrequest = handle_addbiddingadvertisementrequest;
exports.handle_sellafterbidrequest = handle_sellafterbidrequest;
exports.handle_changebidrequest = handle_changebidrequest;
exports.handle_orderrequest = handle_orderrequest;