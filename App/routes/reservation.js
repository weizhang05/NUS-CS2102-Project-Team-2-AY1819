var express = require('express');
var router = express.Router();

const pool = require('../pool');

/* GET home page. */
router.get('/', function(req, res, next) {
	var getCuisineQuery = "SELECT * FROM cuisine";
	pool.query(getCuisineQuery, (err, data) => {
		res.render('reservation', { title: 'Reservation', data: data.rows });
	});
});

module.exports = router;
