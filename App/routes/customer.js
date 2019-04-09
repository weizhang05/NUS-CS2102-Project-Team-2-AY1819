let express = require('express');
let pool = require('../pool');
let router = express.Router();

// Index
router.get('/', function(req, res, next) {
	if(req.cookies.customer){
		res.render('customerIndexAfterLogin', { title: 'CS2102 Restaurant' });
	}
	else{
		res.render('customerIndexBeforeLogin', { title: 'CS2102 Restaurant' });
	}
});
router.post('/', function(req, res, next) {
	if(req.cookies.customer){
		res.render('customerIndexAfterLogin', { title: 'CS2102 Restaurant' });
	}
	else{
		res.render('customerIndexBeforeLogin', { title: 'CS2102 Restaurant' });
	}
});

// Register
router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register' });
});
router.post('/register', function(req, res, next) {
	var name = req.body.name;
	var email = req.body.email;
	var pw = req.body.password;
	var confirmPw = req.body.confirmPassword;
	
	var accountExistQuery = "SELECT * FROM customer WHERE '"+email+"' = email";
	
	pool.query(accountExistQuery, (err, data) => {
		if(data["rowCount"] == 1){
			console.log("User exists!");
		}
		else{
			var createAccountQuery = "INSERT INTO customer(name, email, password, non_user) values('"+name+"','"+email+"','"+pw+"',false);";
			pool.query(createAccountQuery, (err, data) => {} );
			console.log("Account created!");
		}
		
		res.redirect('/')
	});
});

// Login
router.get('/login', function(req, res, next) {
	res.render('login', { title: 'Log In' });
});
router.post('/login', function(req, res, next) {
	var email = req.body.email;
	var pw = req.body.password;
	
	var loginQuery = "select * from customer where email = '"+email+"' and password = '"+pw+"'";
	
	pool.query(loginQuery, (err, data) => {
		if(data["rowCount"] == 1){
			res.cookie("customer", data["rows"]);
			console.log("Login success!");
		}
		else{
			 console.log("Login failed!");
		}
		
		res.redirect('/')
	});
});

// List reservation
router.get('/reservation', function(req, res, next) {
	let customerCookie = req.cookies.customer[0];
	var getCuisineQuery = "SELECT * FROM booking WHERE customer_id = '"+customerCookie["id"]+"'";
	pool.query(getCuisineQuery, (err, data) => {
		res.render('reservation', { title: 'Reservation', data: data.rows });
	});
});

// Reservation (Start)
router.get('/selectCuisine', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/selectCuisine', function(req, res, next) {
	var getCuisineQuery = "SELECT * FROM cuisine";
	pool.query(getCuisineQuery, (err, data) => {
		res.render('selectCuisine', { title: 'Select Cuisine', data: data.rows });
	});
});
// Select restaurant
router.get('/selectRestaurant', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/selectRestaurant', function(req, res, next) {
	var cuisine = req.body.cuisine;
	
	var selectRestaurantQuery = "WITH rows AS(SELECT restaurant_id FROM restaurant_cuisine WHERE cuisine_id = '"+cuisine+"') SELECT * FROM restaurant WHERE id = (SELECT * FROM rows)";
	pool.query(selectRestaurantQuery, (err, data) => {
		console.log(data)
		res.render('selectRestaurant', { title: 'Select Restaurant', data: data.rows });
	});
});
// Select branch
router.get('/selectBranch', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/selectBranch', function(req, res, next) {
	var restaurant = req.body.restaurant;
	
	var selectBranchQuery = "SELECT * FROM branch WHERE restaurant_id = '"+restaurant+"'";
	pool.query(selectBranchQuery, (err, data) => {
		console.log(data)
		res.render('selectBranch', { title: 'Select Branch', data: data.rows });
	});
});
// Reservation (End)
router.get('/makeReservation', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/makeReservation', function(req, res, next) {
	var branch = req.body.branch;
	var num = req.body.num;
	
	var checkAvailabilityQuery = "SELECT 1 FROM branch WHERE id = '"+branch+"' AND "+num+" <= capacity";
	pool.query(checkAvailabilityQuery, (err, data) => {
		if(data["rowCount"] == 1){
			// requires changing ID to currently logged in user
			var createReservationQuery = "INSERT INTO booking(customer_id, branch_id, throughout) VALUES('"+data["rows"]["id"]+"', '"+branch+"', '[2010-01-01 14:30, 2010-01-01 15:30)')";
			pool.query(createReservationQuery, (err, data) => {
			});
			
			var updateBranchQuery = "UPDATE branch SET capacity = capacity - "+num+" WHERE id = '"+branch+"'";
			pool.query(updateBranchQuery, (err, data) => {
			});
			
			res.render('makeReservation', { title: 'Booking is done!', data: data.rows });
		}		
	});
});

// Logout
router.get('/logout', function(req, res, next) {
	res.clearCookie('customer');
	res.redirect('/');
	
});
router.get('/logout', function(req, res, next) {
	res.clearCookie('customer');
	res.redirect('/');
});


module.exports = router;
