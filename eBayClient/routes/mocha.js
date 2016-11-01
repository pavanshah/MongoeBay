var should = require('should'); 
var assert = require('assert');
var request = require('supertest');  
var config = require('./config-debug');

describe('Test Login', function() 
{
    it('Should open login page without error', function(done) 
    {
    	var credentials = {
    			loginUsername: 'pavanshah@gmail.com',
    			loginPassword: 'pavan',
    	      };
    	
    	request('http://localhost:3000')
    	.post('/checklogin')
    	.send(credentials)
  
    	.end(function(err, res) 
		{
          if (err) 
          {
            throw err;
          }
          res.should.have.status(200);
          done();
        });
    });
});