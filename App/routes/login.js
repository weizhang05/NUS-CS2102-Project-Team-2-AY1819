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
	res.render('login', { title: 'Log In' });
});

// POST
router.post('/', function(req, res, next) {
	var email = req.body.email;
	var pw = req.body.password;
	
	var loginQuery = "select * from customer where email = '"+email+"' and password = '"+pw+"'";
	
	pool.query(loginQuery, (err, data) => {
		if(data["rowCount"] == 1){
			console.log("Login success!");
		}
		else{
			 console.log("Login failed!");
		}
		
		res.redirect('/login')
	});
});

module.exports = router;
