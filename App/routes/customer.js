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

const GET_RESTAURANT_BRANCHES_QUERY = `
SELECT b.id id, restaurant_name, b.name, address, plus_code, oh.start_time AS start, oh.end_time AS end
FROM branch b join restaurant r
ON b.restaurant_id = r.id, opening_hours oh
WHERE b.restaurant_id = $1 AND oh.branch_id = b.id
`;

const GET_ALL_BRANCHES_RATINGS_QUERY = `
SELECT branch.name as branch_name, restaurant.restaurant_name, COALESCE(avg(cast(rating_value as Float)), 0) as average_rating, COALESCE(count(rating_value), 0) as number_of_ratings
FROM (branch left outer join rating on rating.branch_id = branch.id) join restaurant on branch.restaurant_id = restaurant.id
GROUP BY branch.name, restaurant.restaurant_name
ORDER BY average_rating desc, restaurant_name asc, branch_name asc;
`

const GET_ALL_RESTAURANT_RATINGS_QUERY = `
WITH restaurant_rating_total as (SELECT restaurant.restaurant_name, COALESCE(sum(cast(rating_value as Float)), 0) as sum_rating, COALESCE(count(rating_value), 0) as number_of_ratings
FROM (branch left outer join rating on rating.branch_id = branch.id) join restaurant on branch.restaurant_id = restaurant.id
GROUP BY restaurant.restaurant_name
ORDER BY sum_rating desc, restaurant_name asc
)

SELECT restaurant_name, case when number_of_ratings > 0 then (sum_rating / number_of_ratings) else 0 end as average_rating, number_of_ratings
FROM restaurant_rating_total;
`

const ADD_BRANCH_RATING_QUERY = `

INSERT into rating(customer_id, branch_id, rating_value)
VALUES($1, (SELECT id FROM branch where branch.name = $2), $3)
ON CONFLICT ON CONSTRAINT rating_customer_id_branch_id_key
DO UPDATE SET rating_value = $3 WHERE rating.customer_id = $1 AND rating.branch_id = (SELECT id FROM branch where branch.name = $2);
`


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

router.get('/customer', function(req, res, next) {
	goIndex(req, res)
});

router.post('/customer', function(req, res, next) {
  goIndex(req, res)
});

// Register
router.get('/customer/register', function(req, res, next) {
  res.render('register', { title: 'Register' });
});

router.post('/customer/register', function(req, res, next) {
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
router.get('/customer/login', function(req, res, next) {
	res.render('login', { title: 'Log In' });
});

router.post('/customer/login', function(req, res, next) {
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
router.get('/customer/reservation', function(req, res, next) {
	let customerCookie = req.cookies.customer[0];
	var getCuisineQuery = "SELECT bk.id AS id, br.name AS name, br.address AS address, bk.pax AS num, bk.throughout AS time FROM booking bk, branch br WHERE bk.branch_id = br.id AND bk.customer_id = '"+customerCookie["id"]+"'";
	pool.query(getCuisineQuery, (err, data) => {
		res.render('reservation', { title: 'Reservation', data: data });
	});
});

// Reservation (Start)
router.get('/customer/selectCuisine', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/customer/selectCuisine', function(req, res, next) {
	var getCuisineQuery = "SELECT * FROM cuisine";
	pool.query(getCuisineQuery, (err, data) => {
		res.render('selectCuisine', { title: 'Select Cuisine', data: data.rows });
	});
});
// Select restaurant
router.get('/customer/selectRestaurant', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/customer/selectRestaurant', function(req, res, next) {
	var cuisine = req.body.cuisine;

	// TODO: HIDE RESTAURANTS WITHOUT ANY BRANCHES
	var selectRestaurantQuery = "WITH rows AS(SELECT restaurant_id FROM restaurant_cuisine WHERE cuisine_id = '"+cuisine+"') SELECT * FROM restaurant WHERE id = (SELECT * FROM rows)";
	pool.query(selectRestaurantQuery, (err, data) => {
		res.render('selectRestaurant', { title: 'Select Restaurant', data: data.rows });
	});
});

// Select branch
router.get('/customer/selectBranch', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/customer/selectBranch', function(req, res, next) {
	const restaurant_id = req.body.restaurant;
	pool.query(GET_RESTAURANT_BRANCHES_QUERY, [restaurant_id], (err, branchesData) => {
	  if (err) {
	  	console.log(err);
		} else {
      rname = branchesData.rows[0].restaurant_name;
      res.render('selectBranch', { title: 'Select Branch', restaurant_name: rname, data: branchesData.rows });
		}
	});
});


// Reservation (End)
router.get('/customer/makeReservation', function(req, res, next) {
	res.redirect('reservation');
});

router.post('/customer/makeReservation', function(req, res, next) {
	console.log(req.body);
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
	
	pool.query(CHECK_BRANCH_AVAILABILITY_QUERY, availability_data, (err, data) => {
	  if (err) {
      console.log("error with avail query");
      console.log(err);
		} else {
	  	const hasAvailability = data.rowCount === 1;
		console.log(data);
      if(hasAvailability){
		  console.log("ATTEMPTING TO INSERT");
      	const customerId = req.cookies.customer[0].id;
        const make_booking_data = [customerId, branch_id, reservation_pax, start_time, end_time];
        console.log(make_booking_data);

        pool.query(MAKE_BOOKING_QUERY, make_booking_data, (err, data) => {
          if (err) {
            console.log("error with making booking");
            console.log(err);
          } else {
			  console.log("SUCCESS");
            res.render('makeReservation', { title: 'Booking is done!', data: data.rows });
					}
        });
      } 
		else {
			console.log("no availability");
			const getRestaurantId = "SELECT DISTINCT restaurant_id AS id FROM branch WHERE id = '"+branch_id+"'"
			pool.query(getRestaurantId, (err, branchesData) => {
				if (err) {
					console.log(err);
				}
				else {
					rId = branchesData.rows[0].id;

					pool.query(GET_RESTAURANT_BRANCHES_QUERY, [rId], (err, branchesData) => {
						if (err) {
							console.log(err);
						} 
						else {
							rname = branchesData.rows[0].restaurant_name;
							res.render('selectBranch', { title: 'Select Branch', restaurant_name: rname, data: branchesData.rows });
						}
					});
				}
			});
		}
		}
	});
});

// Display view/submit rating
router.get('/customer/rating', function(req, res, next) {
    pool.query(GET_ALL_BRANCHES_RATINGS_QUERY, (err, branchesRatingRes) => {
        if (err) {
            console.log("error with retrieving branches ratings");
            console.log(err);
        } else {
            pool.query(GET_ALL_RESTAURANT_RATINGS_QUERY, (err, restaurantRatingRes) => {
                if (err) {
                    console.log("error with retrieving restaurant ratings");
                    console.log(err);
                } else {
                    res.render('rating', { branchesRatings: branchesRatingRes.rows,
                                           restaurantRatings: restaurantRatingRes.rows,
						                    message: req.flash('info')});
                }
            });
        }
    });
});

// Submit a rating
router.post('/customer/rate-branch', function(req, res, next) {
	const customerId = req.cookies.customer[0].id;
	const branchName = req.body.branch_name;
	const ratingInput = req.body.ratingInput;
	console.log(customerId);
	console.log(branchName);
	console.log(ratingInput);
	req.flash('info', 'Successfully rated!');
	pool.query(ADD_BRANCH_RATING_QUERY, [customerId, branchName, ratingInput], (err, dbRes) => {
		if (err) {
			res.send("error adding new rating!");
		} else {
			res.redirect('/customer/rating');
		}
  });
});

// Delete reservation
router.get('/customer/deleteReservation', function(req, res, next) {
	res.redirect('reservation');
});
router.post('/customer/deleteReservation', function(req, res, next) {
	console.log(req.body);
	const bookingId = req.body.id;
	const num = req.body.num;
	const branchName = req.body.branchName
	
	var updateBranchCapacityQuery = "UPDATE branch SET capacity = (capacity + "+num+") where name = '"+branchName+"'";
	pool.query(updateBranchCapacityQuery, (err, data) => {
	});
	
	var deleteReservationQuery = "DELETE FROM booking WHERE id = '"+bookingId+"'";
	pool.query(deleteReservationQuery, (err, data) => {\
	});
	
	let customerCookie = req.cookies.customer[0];
	var getCuisineQuery = "SELECT bk.id AS id, br.name AS name, br.address AS address, bk.pax AS num, bk.throughout AS time FROM booking bk, branch br WHERE bk.branch_id = br.id AND bk.customer_id = '"+customerCookie["id"]+"'";
	pool.query(getCuisineQuery, (err, data) => {
		res.render('reservation', { title: 'Reservation', data: data });

	});
});


// Logout
router.get('/customer/logout', function(req, res, next) {
	res.clearCookie('customer');
	res.redirect('/');
	
});
router.get('/customer/logout', function(req, res, next) {
	res.clearCookie('customer');
	res.redirect('/');
});


module.exports = router;
