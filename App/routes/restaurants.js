const express = require('express');
const pool = require('../pool');
const branchRouter = require('./branch');
const cuisineRouter = require('./cuisine');
const menuItemRouter = require('./menu');
const hoursTemplateRouter = require('./hours-template');
const router = express.Router();

router.use('/branch', branchRouter);
router.use('/cuisine', cuisineRouter);
router.use('/menu', menuItemRouter);
router.use('/hours', hoursTemplateRouter);

const NEW_RESTAURANT_QUERY = `
INSERT INTO restaurant (account_name, restaurant_name)
VALUES ($1, $2)
RETURNING id;
`;

const EXISTING_RESTAURANT_QUERY = `
SELECT id
FROM restaurant
WHERE account_name = $1;
`;

const RESTAURANT_INFO_QUERY = `
SELECT id, account_name, restaurant_name
FROM restaurant
WHERE id = $1;
`;

const EDIT_RESTAURANT_QUERY = `
UPDATE restaurant
SET account_name = $2, restaurant_name = $3
WHERE id = $1;
`;

const BRANCHES_QUERY = `
SELECT id, name, address, plus_code, capacity
FROM branch
WHERE restaurant_id = $1
ORDER BY name ASC;
`;

const MENU_QUERY = `
SELECT id, name, cents
FROM menu_item
WHERE restaurant_id = $1
ORDER BY name ASC;
`;

const CUISINES_QUERY = `
SELECT rc.id, name
FROM restaurant_cuisine rc join cuisine c on rc.cuisine_id = c.id
WHERE restaurant_id = $1
ORDER BY name ASC;
`;

const OPEN_HOURS_TEMPLATE_QUERY = `
SELECT id, restaurant_id, start_day, start_time, end_day, end_time
FROM opening_hours_template
WHERE restaurant_id = $1
ORDER BY (start_day, start_time) ASC;
`;

const intToDayStr = (i) => {
  switch (i) {
    case 0:
    return "Sunday";
    case 1:
    return "Monday";
    case 2:
    return "Tuesday";
    case 3:
    return "Wednesday";
    case 4:
    return "Thursday";
    case 5:
    return "Friday";
    case 6:
    return "Saturday";
  }
};


const renderLogin = (req, res, next) => {
  res.render('restaurants', {});
};

const renderDashboard = (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
  pool.query(RESTAURANT_INFO_QUERY, [restaurant_id], (err, dbRes) => {
    if (err || dbRes.rows.length !== 1) {
      res.send("error!");
    } else {
      const {account_name, restaurant_name} = dbRes.rows[0];
      pool.query(BRANCHES_QUERY, [restaurant_id], (err, dbBranchesRes) => {
        if (err) {
          res.send("error!");
        } else {
          const branches = dbBranchesRes.rows;
          pool.query(MENU_QUERY, [restaurant_id], (err, dbMenuRes) => {
            if (err) {
              res.send("error!");
            } else {
              const menu = dbMenuRes.rows;
              pool.query(CUISINES_QUERY, [restaurant_id], (err, dbCuisineRes) => {
                if (err) {
                  res.send("error!");
                } else {
                  const cuisines = dbCuisineRes.rows;
                  pool.query(OPEN_HOURS_TEMPLATE_QUERY, [restaurant_id], (err, dbOpenHoursTemplateRes) => {
                    if (err) {
                      res.send("error!");
                    } else {
                      const hours = dbOpenHoursTemplateRes.rows;
                      res.render('restaurants-dashboard', {
                        restaurant_id,
                        account_name,
                        branches,
                        cuisines,
                        menu,
                        restaurant_name,
                        hours,
                        intToDayStr,
                      });
                    }
                  });
                }
              });
            }
          });
        }
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
  const {account_name, restaurant_name, login_type} = req.body;
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
    res.send({error: "Invalid data"});
  }
});

router.get('/edit', (req, res, next) => {
  pool.query(RESTAURANT_INFO_QUERY, [req.cookies.restaurants], (err, dbRes) => {
    if (err || dbRes.rows.length !== 1) {
      res.send("error!");
    } else {
      const {account_name, restaurant_name} = dbRes.rows[0];
      res.render('restaurants-edit', {
        account_name,
        restaurant_name
      });
    }
  });
});

router.post('/edit', (req, res, next) => {
  const {account_name, restaurant_name} = req.body;
  const id = req.cookies.restaurants;
  pool.query(EDIT_RESTAURANT_QUERY, [id, account_name, restaurant_name], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect('/restaurants');
    }
  });
});

module.exports = router;
