let express = require('express');
let pool = require('../pool');
let router = express.Router();


// Check if making a booking at a branch is possible
// 1) check if start/end booking time is in operating hours
// 		4 cases:
//		 	1) booking_start is on start_day
//		 	booking_end is before end_day
//		 	2) booking_start is after start day
//		 	booking_end is on end_day
//		 	3) booking_start is on start_day
//		 	booking_end is on end_day
//		 	4) book_start is after start_day
//		 	book_end is before end_day
// 2) check if branch has capacity
// 3) check operating hours override

// $1 = branch id
// $2 = start_day (int 0-6)
// $3 = start_time (time)
// $4 = end_day
// $5 = end_time
// $6 = start_ts (timestamp)
// $7 = end_ts
// $8 = booking_pax
const CHECK_BRANCH_AVAILABILITY_QUERY = `
SELECT 1
FROM opening_hours op1
WHERE op1.branch_id = $1 and
EXISTS (
  select 1
  FROM opening_hours op2
  WHERE op2.branch_id = op1.branch_id
  AND (
  (op2.start_day = $2
  AND op2.start_time <= $3
  AND op2.end_day > $4)
  OR
  (op2.start_day < $2
  AND op2.end_time >= $5
  AND op2.end_day = $4)
  OR
  (op2.start_day = $2
  AND op2.end_day = $4
  AND op2.start_time <= $3 
  AND op2.end_time >= $5)
  OR
  (op2.start_day < $2
  AND op2.end_day > $4)
	)
) AND 
EXISTS (
	select 1
	FROM branch br
	WHERE br.id = op1.branch_id
	AND 
      br.capacity - $8 >= 
      (SELECT COALESCE(SUM(bk.pax), 0)
        FROM booking bk
        WHERE br.id = bk.branch_id
        AND bk.throughout && tsrange($6, $7, '[)'))
)
`;

const MAKE_BOOKING_QUERY = `
INSERT INTO booking(customer_id, branch_id, pax, throughout)
VALUES($1, $2, $3, tsrange($4, $5, '[)'))
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

// List reservation
router.get('/reservation', function(req, res, next) {
	console.log(req.cookies);
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

	// TODO: HIDE RESTAURANTS WITHOUT ANY BRANCHES
	var selectRestaurantQuery = "WITH rows AS(SELECT restaurant_id FROM restaurant_cuisine WHERE cuisine_id = '"+cuisine+"') SELECT * FROM restaurant WHERE id = (SELECT * FROM rows)";
	pool.query(selectRestaurantQuery, (err, data) => {
		res.render('selectRestaurant', { title: 'Select Restaurant', data: data.rows });
	});
});

// Select branch

const RESTAURANT_BRANCHES_QUERY = `
SELECT b.id id, restaurant_name, b.name, address, plus_code 
FROM branch b join restaurant r
ON b.restaurant_id = r.id
WHERE b.restaurant_id = $1
`;

router.get('/selectBranch', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/selectBranch', function(req, res, next) {
	const restaurant_id = req.body.restaurant;
	pool.query(RESTAURANT_BRANCHES_QUERY, [restaurant_id], (err, branchesData) => {
	  if (err) {
	  	console.log(err);
		} else {
      rname = branchesData.rows[0].restaurant_name;
      res.render('selectBranch', { title: 'Select Branch', restaurant_name: rname, data: branchesData.rows });
		}
	});
});


// Reservation (End)
router.get('/makeReservation', function(req, res, next) {
	res.redirect('reservation');
});

router.post('/makeReservation', function(req, res, next) {
	const {branch_id, reservation_pax, reservation_datetime, duration_mins} = req.body;

	const start_time = new Date(reservation_datetime);
  const end_time = new Date(start_time.getTime() + duration_mins * 60 * 1000);

	function get_seconds_in_day(date) {
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	}

  const availability_data = [branch_id,
  	start_time.getDay(),
  	get_seconds_in_day(start_time),
  	end_time.getDay(),
    get_seconds_in_day(end_time),
		start_time,
		end_time,
		reservation_pax
	];

  console.log(availability_data);

	pool.query(CHECK_BRANCH_AVAILABILITY_QUERY, availability_data, (err, data) => {
	  if (err) {
      console.log("error with avail query");
      console.log(err);
		} else {

      console.log(data);
	  	const hasAvailability = data.rowCount === 1;

      if(hasAvailability){

      	const customerId = req.cookies.customer[0].id;
        const make_booking_data = [customerId, branch_id, reservation_pax, start_time, end_time];
        console.log(make_booking_data);

        pool.query(MAKE_BOOKING_QUERY, make_booking_data, (err, data) => {
          if (err) {
            console.log("error with making booking");
            console.log(err);
          } else {
            res.render('makeReservation', { title: 'Booking is done!', data: data.rows });
					}
        });
      } else {
        console.log("no availablity");
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
