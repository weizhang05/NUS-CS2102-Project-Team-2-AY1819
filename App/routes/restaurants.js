var express = require('express');
var pool = require('../pool');
var router = express.Router();

const NEW_RESTAURANT_QUERY = `
INSERT INTO restaurant (account_name, restaurant_name)
VALUES ($1, $2)
RETURNING id;
`;

const EXISTING_RESTAURANT_QUERY = `
SELECT id
FROM restaurant
WHERE account_name = $1
`;

const renderLogin = (req, res, next) => {
  res.render('restaurants', { title: 'Restaurants' });
};

const renderDashboard = (req, res, next) => {
  res.render('restaurants-dashboard', { title: 'Restauranteur Dashboard' });
};

/* GET restaurant home page. */
router.get('/', function(req, res, next) {
  if (req.cookies.restaurants) {
    renderDashboard(req, res, next);
  } else {
    renderLogin(req, res, next);
  }
});

router.get('/logout', function(req, res, next) {
  res.clearCookie('restaurants');
  res.redirect('/restaurants');
});

router.post('/', function(req, res, next) {
  const { account_name, restaurant_name, login_type } = req.body;
  if (login_type === "new") {
    pool.query(NEW_RESTAURANT_QUERY, [account_name, restaurant_name], (err, dbRes) => {
      if (dbRes) {
        res.cookie('restaurants', dbRes.rows[0].id);
        res.redirect('/restaurants')
      } else {
        res.send("error!");
      }
    })
  } else if (login_type === "existing") {
    console.log(account_name);
    pool.query(EXISTING_RESTAURANT_QUERY, [account_name], (err, dbRes) => {
      console.log(dbRes);
      if (dbRes && dbRes.rows.length === 1) {
        res.cookie('restaurants', dbRes.rows[0].id);
        res.redirect('/restaurants')
      } else {
        res.send("error!");
      }
    })
  } else {
    res.status(404);
    res.send({ error: "Invalid data" });
  }
});

module.exports = router;
