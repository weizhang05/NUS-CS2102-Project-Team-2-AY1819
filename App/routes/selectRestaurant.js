var express = require('express');
var router = express.Router();

const { Pool } = require('pg')
const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.redirect('/reservation');
});

// POST
router.post('/', function(req, res, next) {
	var cuisine = req.body.cuisine;
	
	var selectRestaurantQuery = "WITH rows AS(SELECT restaurant_id FROM restaurant_cuisine WHERE cuisine_id = '"+cuisine+"') SELECT * FROM restaurant WHERE id = (SELECT * FROM rows)";
	pool.query(selectRestaurantQuery, (err, data) => {
		console.log(data)
		res.render('selectRestaurant', { title: 'Select Restaurant', data: data.rows });
	});
});

module.exports = router;
