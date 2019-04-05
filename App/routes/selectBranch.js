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
	var restaurant = req.body.restaurant;
	
	var selectBranchQuery = "SELECT * FROM branch WHERE restaurant_id = '"+restaurant+"'";
	pool.query(selectBranchQuery, (err, data) => {
		console.log(data)
		res.render('selectBranch', { title: 'Select Branch', data: data.rows });
	});
});

module.exports = router;
