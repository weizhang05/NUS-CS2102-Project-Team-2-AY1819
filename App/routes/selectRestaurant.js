var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',
  port: 5432,
})

/* GET home page. */
router.get('/', function(req, res, next) {
	res.redirect('/reservation');
});

// POST
router.post('/', function(req, res, next) {
	res.render('selectRestaurant', { title: 'Select Restaurant' });
	var cuisine = req.body.cuisine;
	
	// var selectRestaurantQuery = "WITH rows AS(SELECT * FROM restaurant_cuisine WHERE cuisine_id = "+cuisine+" RETURNING restaurant_id) SELECT * FROM restaurant WHERE id = restaurant_id SELECT * FROM rows;";
	var selectRestaurantQuery = "SELECT * FROM restaurant"
	
	pool.query(selectRestaurantQuery, (err, data) => {
		res.render('selectRestaurant', { title: 'Select Restaurant', data: data.rows });
	});
});

module.exports = router;
