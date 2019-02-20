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

const RESTAURANT_INFO_QUERY = `
SELECT id, account_name, restaurant_name
FROM restaurant
WHERE id = $1
`;

const EDIT_RESTAURANT_QUERY = `
UPDATE restaurant
SET account_name = $2, restaurant_name = $3
WHERE id = $1
`;

const renderLogin = (req, res, next) => {
  res.render('restaurants', {});
};

const renderDashboard = (req, res, next) => {
  pool.query(RESTAURANT_INFO_QUERY, [req.cookies.restaurants], (err, dbRes) => {
    if (err || dbRes.rows.length !== 1) {
      res.send("error!");
    } else {
      const { account_name, restaurant_name } = dbRes.rows[0];
      res.render('restaurants-dashboard', {
        account_name,
        restaurant_name
      });
    }
  });
};

/* GET restaurant home page. */
router.get('/', (req, res, next) => {
  if (req.cookies.restaurants) {
    renderDashboard(req, res, next);
  } else {
    renderLogin(req, res, next);
  }
});

router.get('/logout', (req, res, next) => {
  res.clearCookie('restaurants');
  res.redirect('/restaurants');
});

router.post('/', (req, res, next) => {
  const { account_name, restaurant_name, login_type } = req.body;
  if (login_type === "new") {
    pool.query(NEW_RESTAURANT_QUERY, [account_name, restaurant_name], (err, dbRes) => {
      if (err || dbRes.rows.length !== 1) {
        console.log(err);
        res.send("error!");
      } else {
        res.cookie('restaurants', dbRes.rows[0].id);
        res.redirect('/restaurants');
      }
    });
  } else if (login_type === "existing") {
    console.log(account_name);
    pool.query(EXISTING_RESTAURANT_QUERY, [account_name], (err, dbRes) => {
      if (err || dbRes.rows.length !== 1) {
        res.send("error!");
      } else {
        res.cookie('restaurants', dbRes.rows[0].id);
        res.redirect('/restaurants')
      }
    });
  } else {
    res.status(404);
    res.send({ error: "Invalid data" });
  }
});

router.get('/edit', (req, res, next) => {
  pool.query(RESTAURANT_INFO_QUERY, [req.cookies.restaurants], (err, dbRes) => {
    if (err || dbRes.rows.length !== 1) {
      res.send("error!");
    } else {
      const { account_name, restaurant_name } = dbRes.rows[0];
      res.render('restaurants-edit', {
        account_name,
        restaurant_name
      });
    }
  });
});

router.post('/edit', (req, res, next) => {
  const { account_name, restaurant_name } = req.body;
  const id = req.cookies.restaurants;
  pool.query(EDIT_RESTAURANT_QUERY, [id, account_name, restaurant_name], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect('/restaurants');
    }
  });
})

module.exports = router;
