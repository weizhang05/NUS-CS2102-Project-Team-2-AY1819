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
  res.render('register', { title: 'Register' });
});

// POST
router.post('/', function(req, res, next) {
	var name = req.body.name;
	var email = req.body.email;
	var pw = req.body.password;
	var confirmPw = req.body.confirmPassword;
	
	var registerQuery = "SELECT * FROM customer WHERE '"+email+"' = email";
	
	pool.query(registerQuery, (err, data) => {
		if(data["rowCount"] == 1){
			console.log("User exists!");
		}
		else{
			 console.log("meowwww");
		}
		
		res.redirect('/register')
	});
});

module.exports = router;
