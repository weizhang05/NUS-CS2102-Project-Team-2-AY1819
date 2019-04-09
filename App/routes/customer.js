let express = require('express');
let pool = require('../pool');
let router = express.Router();

const RESTAURANT_NAME_QUERY = `
SELECT name 
FROM restaurant r
WHERE r.id = $1
`;

// Index
function goIndex(req, res) {
  if(req.cookies.customer){
    res.render('customerIndexAfterLogin', { title: 'CS2102 Restaurant' });
  }
  else{
    res.render('customerIndexBeforeLogin', { title: 'CS2102 Restaurant' });
  }
}

router.get('/', function(req, res, next) {
	goIndex(req, res)
});

router.post('/', function(req, res, next) {
  goIndex(req, res)
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
		if(data["rowCount"] === 1){
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
		if(data["rowCount"] === 1){
			res.cookie("customer", data["rows"]);
			console.log("Login success!");
		}
		else{
			 console.log("Login failed!");
		}
		
		res.redirect('/')
	});
});


// Reservation (Start)
router.get('/reservation', function(req, res, next) {
	var getCuisineQuery = "SELECT * FROM cuisine";
	pool.query(getCuisineQuery, (err, data) => {
		res.render('reservation', { title: 'Reservation', data: data.rows });
	});
});

// Select restaurant
router.get('/selectRestaurant', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/selectRestaurant', function(req, res, next) {
	var cuisine = req.body.cuisine;

	// TODO: HIDE RESTAURANTS WITHOUT ANY BRANCHES
	var selectRestaurantQuery = "WITH rows AS(SELECT restaurant_id FROM restaurant_cuisine WHERE cuisine_id = '"+cuisine+"') SELECT * FROM restaurant WHERE id = (SELECT * FROM rows)";
	pool.query(selectRestaurantQuery, (err, data) => {
		console.log(data);
		res.render('selectRestaurant', { title: 'Select Restaurant', data: data.rows });
	});
});

// Select branch

const RESTAURANT_BRANCHES_QUERY = `
SELECT * 
FROM branch b join restaurant r 
ON b.restaurant_id = r.id
WHERE restaurant_id = $1
`;

router.get('/selectBranch', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/selectBranch', function(req, res, next) {
	const restaurant_id = req.body.restaurant;
	pool.query(RESTAURANT_BRANCHES_QUERY, [restaurant_id], (err, branchesData) => {
		console.log(branchesData.rows);
    rname = branchesData.rows[0].restaurant_name;
    res.render('selectBranch', { title: 'Select Branch', restaurant_name: rname, data: branchesData.rows });
	});
});


const CHECK_AVAILABILITY_QUERY = `
SELECT id
FROM admins
WHERE account_name = $1;
`;

const MAKE_BOOKING_QUERY = `

`;

// Reservation (End)
router.get('/makeReservation', function(req, res, next) {
	res.redirect('reservation');
});

router.post('/makeReservation', function(req, res, next) {
	const {branch, reservationPax, start, end} = req.body;
	
	pool.query(CHECK_AVAILABILITY_QUERY, (err, data) => {
		if (err) {
      console.log(err);
    } else {
      if(data.rows[0]){
        pool.query(MAKE_BOOKING_QUERY, (err, data) => {

        });
        res.render('makeReservation', { title: 'Booking is done!', data: data.rows });
      }
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
