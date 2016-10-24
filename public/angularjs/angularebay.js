var login = angular.module('login', []);

login.controller('login', function($scope, $http, $interval) {

	$scope.trial = 5;
	$scope.expiryflag = true;
	$scope.invalid_login = true;
	$scope.unexpected_error = true;
	$scope.signupsuccess = true;
	$scope.successadvertisement = true;
	var flag = 0;
	var dm = [];
	$scope.countries = ['USA', 'India', 'China', 'Other'];
	
	$scope.login = function() {
		$http({
			method : "POST",
			url : '/checklogin',
			data : {
				"loginUsername" : $scope.loginUsername,
				"loginPassword" : $scope.loginPassword
			}
		}).success(function(data) {
			//checking the response data for statusCode
			if (data.statusCode == 401) {
				$scope.invalid_login = false;
				$scope.unexpected_error = true;
			}
			else
				{
					window.location.assign("/homepage"); 	//get request
				}
		}).error(function(error) {
			$scope.unexpected_error = false;
			$scope.invalid_login = true;
		});
	};
	
	
	$scope.signup = function() {

		$http({
			method : "POST",
			url : '/checkSignup',
			data : {
				"inputFirstName" : $scope.inputFirstName,
				"inputLastName" : $scope.inputLastName,
				"inputMobileNumber" : $scope.inputMobileNumber,
				"inputDateOfBirth" : $scope.inputDateOfBirth,
				"inputUsername" : $scope.inputUsername,
				"inputPassword" : $scope.inputPassword
			}
		}).success(function(data) {
			//checking the response data for statusCode
			if (data.statusCode == 401) {
				$scope.invalid_login = false;
				$scope.unexpected_error = true;
			}
			else
			{
				$scope.signupsuccess = false;
			}
		}).error(function(error) {
			$scope.unexpected_error = false;
			$scope.invalid_login = true;
		});
	};
	
	
	$scope.addtocart = function(itemname, itemprice)
	{
		
		$http({
			method : "POST",
			url : '/addtocart',
			data : {
				"itemname" : itemname,
				"itemprice" : itemprice
			}
		}).success(function(data) {
			//checking the response data for statusCode
			if (data.statusCode == 401) {
				
			}
			else
				{
					window.location.assign("/homepage"); 	//get request
				}
		}).error(function(error) {
		
		});
		
	};
	
	
	$scope.deleteItem = function(itemname, itemprice)
	{
		$http({
			method : "POST",
			url : '/deletefromcart',
			data : {
				"itemname" : itemname,
				"itemprice" : itemprice
			}
		}).success(function(data) {
			//checking the response data for statusCode
			if (data.statusCode == 401) {
				
			}
			else
				{
					window.location.assign("/homepage"); 	//get request
				}
		}).error(function(error) {
		
		});
	}
	
	
	$scope.submitadvertisement = function(itemname, itemdescription, itemprice)
	{
		$http({
			method : "POST",
			url : '/submitadvertisement',
			data : {
				"itemname" : itemname,
				"itemdescription" : itemdescription,
				"itemprice" : itemprice
			}
		}).success(function(data) {
			//checking the response data for statusCode
			if (data.statusCode == 401) {
				
			}
			else
			{
				$scope.successadvertisement = false;	
			}
		}).error(function(error) {
		
		});
	
	};
	
	
	$scope.checkDate = function(expiryDate)
	{
		if(flag === 0)
			{
				if(expiryDate.length === 2)
				{
					$scope.expiryDate = expiryDate+'-';
					flag = 1;
				}
			}
		
		if(expiryDate.length === 0 || expiryDate.length === 1 || expiryDate.length === 3 || expiryDate.length === 4)
			{	
				flag = 0;
			}
	};
	
	
	$scope.checkDetails = function(ccNumber, expiryDate,ccCVV)
	{
		
		//date validation
		dm = expiryDate.split('-');
		var month = dm[0];
		var year = '20'+dm[1];
		var currentdate = new Date();
		
		if(year  > currentdate.getFullYear() && month <= 12)
		{
			$scope.trial = "success";
		}
		else if(year  == currentdate.getFullYear() && month <= 12)
		{
			if(month >= currentdate.getMonth())
			{
				$scope.trial = "success";
			}
			
			else
			{
				$scope.expiryflag = false;
			}
		}
		else
		{
			$scope.expiryflag = false;
		}		
	};
	
});
