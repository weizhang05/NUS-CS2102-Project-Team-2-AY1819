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
	var branch = req.body.branch;
	var num = req.body.num;
	
	var checkAvailabilityQuery = "SELECT 1 FROM branch WHERE id = '"+branch+"' AND "+num+" <= capacity";
	pool.query(checkAvailabilityQuery, (err, data) => {
		if(data["rowCount"] == 1){
			// requires changing ID to currently logged in user
			var createReservationQuery = "INSERT INTO booking(customer_id, branch_id, throughout) VALUES('b3877bab-4afe-4d5e-82b7-371991e1626b', '"+branch+"', '[2010-01-01 14:30, 2010-01-01 15:30)')";
			pool.query(createReservationQuery, (err, data) => {
			});
			
			var updateBranchQuery = "UPDATE branch SET capacity = capacity - "+num+" WHERE id = '"+branch+"'";
			pool.query(updateBranchQuery, (err, data) => {
			});
			
			res.render('makeReservation', { title: 'Booking is done!', data: data.rows });
		}		
	});
});

module.exports = router;
