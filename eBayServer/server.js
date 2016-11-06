var amqp = require('amqp')	
, util = require('util');

var handler = require('./services/handler')

var mongo = require("./services/mongo");
var mongoURL = "mongodb://localhost:27017/eBayDatabase";
var mongoSessionConnectURL = "mongodb://localhost:27017/eBayDatabase";


mongo.createPool(function(){
	
	mongo.connect(mongoSessionConnectURL, function(){
		console.log('Connected to mongo at: ' + mongoSessionConnectURL);
	});
	
});

var cnn = amqp.createConnection({host:'127.0.0.1'});
console.log("connection created");

cnn.on('ready', function(){

	//listening to login queue
	cnn.queue('login_queue', function(q){
		console.log("listening to login_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_loginrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for login_queue"+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to homepage queue
	cnn.queue('homepage_queue', function(q){
		console.log("listening to homepage_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_homepagerequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for homepage_queue"+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to signup queue
	cnn.queue('signup_queue', function(q){
		console.log("listening to signup_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_signuprequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for signup_queue"+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to addtocart queue
	cnn.queue('addtocart_queue', function(q){
		console.log("listening to addtocart_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_addtocartrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for addtocart_queue"+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to deletefromcartqueue queue
	cnn.queue('deletefromcart_queue', function(q){
		console.log("listening to deletefromcart_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_deletefromcartrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for deletefromcart_queue"+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to myaccount queue
	cnn.queue('myaccount_queue', function(q){
		console.log("listening to myaccount_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_myaccountrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for myaccount_queue"+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to advertisement_queue
	cnn.queue('advertisement_queue', function(q){
		console.log("listening to advertisement_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_addadvertisementrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for advertisement_queue"+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to biddingadvertisement_queue
	cnn.queue('biddingadvertisement_queue', function(q){
		console.log("listening to biddingadvertisement_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_addbiddingadvertisementrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for biddingadvertisement_queue "+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to sellafterbid_queue
	cnn.queue('sellafterbid_queue', function(q){
		console.log("listening to sellafterbid_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_sellafterbidrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for sellafterbid_queue "+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	
	//listening to changebid_queue
	cnn.queue('changebid_queue', function(q){
		console.log("listening to changebid_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_changebidrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for changebid_queue "+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
	//listening to order_queue
	cnn.queue('order_queue', function(q){
		console.log("listening to order_queue");
		
			q.subscribe(function(message, headers, deliveryInfo, m){
				
			handler.handle_orderrequest(message, function(err,res){		//server is waiting for result to receive
				console.log("result received for order_queue "+res);
				//published to replyTo queue, client is already subscribed so will be able to listen
				cnn.publish(m.replyTo, res, {
					contentType:'application/json',
					contentEncoding:'utf-8',
					correlationId:m.correlationId
				});
			});
		});	
	});
	
});