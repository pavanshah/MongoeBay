var MongoClient = require('mongodb').MongoClient;
var db;
var connected = false;
var mongoSessionConnectURL = "mongodb://localhost:27017/eBayDatabase";
var connectionarray = [];
var waitingQueue = [];

exports.connect = function(url, callback)
{
	if(connectionarray.length > 0)
	{
		console.log("Request to connect, connectionarray "+connectionarray.length);
		db = connectionarray.pop();
		callback(db);
	}
	
	else
	{
		console.log("connection not available, adding to waiting queue");
		waitingQueue.push(callback);
	}
};


function returnConnection(connection)
{
	console.log("connection "+connection);
	connectionarray.push(connection);
	console.log("Connection Array after adding new connection "+connectionarray.length);
}


function createPool(callback)
{
	var i, j = 0;
	
	for(i = 0; i < 500 ; i++)
	{
			 MongoClient.connect(mongoSessionConnectURL, function(err, _db)
			 {
				 j++;
				 if (err) { throw new Error('Could not connect: '+err); }
				 db = _db;
			   	 connected = true;
			   	 console.log(connected +" is connected?");
			   	 connectionarray.push(db);
			   	 console.log("connection array length "+connectionarray.length);
			   	 
			   	 if(j == 500)
			   	 {
			   		 console.log("All connections created");
			   		 callback(1);
			   	 }
			 });	  
	}
}


//to ensure that connections are made available for waiting callbacks
setInterval(function(){
	if(connectionarray.length > 0)
		{
			if(waitingQueue.length > 0)
			{
				console.log("connectionarray "+connectionarray.length);
				console.log("waitingQueue "+waitingQueue.length);
				console.log('removing the connection and providing to queue');
				callback = waitingQueue.shift();
				connection = connectionarray.pop();
				console.log("connectionarray "+connectionarray.length);
				console.log("waitingQueue "+waitingQueue.length);
				callback(connection);
		}
	}
}, 1000);



exports.collection = function(name){
    if (!connected) {
      throw new Error('Must connect to Mongo before calling "collection"');
    } 
    return db.collection(name);
};


exports.createPool = createPool;
exports.returnConnection = returnConnection;