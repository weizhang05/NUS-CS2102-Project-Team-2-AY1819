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

const MAKE_BOOKING_QUERY = `
INSERT INTO booking(customer_id, branch_id, pax, throughout)
VALUES($1, $2, $3, $4)
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

const CUISINE_QUERY = `
SELECT id, name
FROM cuisine;
`;
// current limitation in query: connected opening hours as separate entries in db are not considered as a continuous range
const CHOOSE_LOCATION_QUERY = `
SELECT R.id AS restaurant_id, R.restaurant_name AS restaurant_name, B.id AS branch_id, B.name AS branch_name, B.address AS address
FROM branch B
JOIN restaurant R ON (B.restaurant_id = R.id)
JOIN restaurant_cuisine RC ON (R.id = RC.restaurant_id)
WHERE TRUE
AND (RC.cuisine_id = ANY ($1) OR $1 IS NULL)
AND (R.restaurant_name LIKE $2 OR B.name LIKE $2 OR $2 IS NULL)
AND (valid_new_booking(B.id, $4, $3) OR ($3 IS NULL AND $4 IS NULL))
LIMIT 50;
`;
router.get('/customer/chooseLocation', (req, res) => {
	const selectedCuisines = [];
	for (const key in req.query) {
		if (key.startsWith('cuisine-')) {
			selectedCuisines.push(req.query[key]);
		}
	}
	const { filter_name, filter_booking, filter_pax, filter_start, filter_end } = req.query;
	pool.query(CUISINE_QUERY, (err, dbCuisineRes) => {
		const cuisines = dbCuisineRes.rows;
		pool.query(CHOOSE_LOCATION_QUERY,
		[
			selectedCuisines.length > 0 ? selectedCuisines : null,
			filter_name ? '%' + filter_name + '%' : null,
			filter_booking ? filter_pax : null,
			filter_booking ? `[${filter_start},${filter_end}]` : null
		],
		(err, dbLocationRes) => {
			const branches = dbLocationRes.rows;
			res.render('chooseLocation', {
				selectedCuisines,
				filter_name,
				filter_booking,
				filter_pax,
				filter_start,
				filter_end,
				cuisines,
				branches
			});
		})
	})
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
	const {branch_id, reservation_pax, reservation_start, reservation_end} = req.body;
	console.log("ATTEMPTING TO INSERT");
		const customerId = req.cookies.customer[0].id;
		const make_booking_data = [customerId, branch_id, reservation_pax, `[${reservation_start}, ${reservation_end}]`];
		console.log(make_booking_data);

		pool.query(MAKE_BOOKING_QUERY, make_booking_data, (err, data) => {
			if (err) {
				console.log("error with making booking");
				console.log(err);
				res.redirect('chooseLocation', { flash: 'Could not make reservation' });
			} else {
		console.log("SUCCESS");
				res.render('makeReservation', { title: 'Booking is done!', data: data.rows });
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
	pool.query(deleteReservationQuery, (err, data) => {
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
