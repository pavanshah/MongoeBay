var amqp = require('amqp')
  , crypto = require('crypto');
 
var TIMEOUT=8000; //time to wait for response in ms
var CONTENT_TYPE='application/json';
var CONTENT_ENCODING='utf-8';
var self;
 
exports = module.exports = AmqpRpc;
 
function AmqpRpc(connection){
  console.log("AmqpRcpc initialized with connection :"+connection);
  self = this;
  this.connection = connection; 
  this.requests = {}; //hash to store request in wait for response
  console.log("Request queue created"+this.requests);
  this.response_queue = false; //placeholder for the future queue
  console.log("Response queue created "+this.response_queue);
}

AmqpRpc.prototype.makeRequest = function(queue_name, content, callback){	//prototype to add a new method
	
  console.log("inside amqprpc.makeRequest"+queue_name+content);
  self = this;
  //generate a unique correlation id for this call
  var correlationId = crypto.randomBytes(16).toString('hex');
  console.log("correlationId :"+correlationId);
  //create a timeout for what should happen if we don't get a response
  var tId = setTimeout(function(corr_id){
    //if this ever gets called we didn't get a response in a 
    //timely fashion
	console.log("inside timeout");
    callback(new Error("timeout " + corr_id));
    //delete the entry from hash
    delete self.requests[corr_id];
  }, TIMEOUT, correlationId);
 
  
  //create a request entry to store in a hash
  var entry = {
    callback:callback,	//callback function which is required for replying
    timeout: tId //the id for the timeout so we can clear it
  };
  
  //put the entry in the hash so we can match the response later
  self.requests[correlationId]=entry;	//RPC_queue request added
  console.log("request queue now ="+self.requests);
  //make sure we have a response queue
    self.setupResponseQueue(function(){
	 
    //2 parameters are passed to RPC queue, correlation id and replyTo which is a callback queue
    console.log("setup response queue");
    //put the request on a queue and publish for server to listen
    self.connection.publish(queue_name, content, {		//queue_name received in the request
      correlationId:correlationId,		//one generated randomly for every request
      contentType:CONTENT_TYPE,
      contentEncoding:CONTENT_ENCODING,
      replyTo:self.response_queue});
  });
};
 
 
AmqpRpc.prototype.setupResponseQueue = function(next){
  //don't mess around if we have a queue
	console.log("setup response queue prototype");
  if(this.response_queue) return next();

  self = this;
  //create the queue
  
  self.connection.queue('', {exclusive:true}, function(q){  
	console.log("contacted server");  
    //store the name
    self.response_queue = q.name;

    //subscribe to messages
    q.subscribe(function(message, headers, deliveryInfo, m){
      //get the correlationId
      var correlationId = m.correlationId;
      //is it a response to a pending request
      if(correlationId in self.requests){		//listening for responses to reply_to queue
        //retreive the request entry
        var entry = self.requests[correlationId];
        //make sure we don't timeout by clearing it
        clearTimeout(entry.timeout);	//clearing timeout as response received
        //delete the entry from hash
        delete self.requests[correlationId];
        //callback, no err
        entry.callback(null, message);
      }
    });
    return next();    
  });
};