let express = require('express');
let pool = require('../pool');
let router = express.Router();

const cuisineRouter = require('./cuisine');

router.use('/cuisine', cuisineRouter);

// TODO: some preprocessing to make input more user-friendly
// TODO: standardize booking and reservation


const EXISTING_ADMIN_QUERY = `
SELECT id
FROM admins
WHERE account_name = $1;
`;

const ADMIN_INFO_QUERY = `
SELECT account_name
FROM admins
WHERE id = $1;
`;

const CUSTOMER_INFO_QUERY = `
SELECT id, name, email
FROM customer
`;

const DELETE_CUSTOMER_QUERY = `
DELETE FROM customer
WHERE id = $1;
`;

const UPDATE_USER_QUERY = `
WITH custinfo AS (
    SELECT id, 
    coalesce($2, c.name) as name, 
    coalesce($3, c.password) as password,
    coalesce($4, c.email) as email
    FROM customer c
    WHERE c.id = $1
)
UPDATE customer
SET name = (SELECT name from custinfo),
password = (SELECT password from custinfo),
email = (SELECT email from custinfo)
WHERE id = (SELECT id from custinfo);
`;

const RESTAURANT_INFO_QUERY = `
SELECT id, account_name, restaurant_name
FROM restaurant
`;

const CUISINES_INFO_QUERY = `
SELECT rc.id pair_id, r.restaurant_name, c.name cuisine_name
FROM restaurant_cuisine rc join cuisine c on rc.cuisine_id = c.id 
    join restaurant r on r.id = rc.restaurant_id
ORDER BY r.restaurant_name ASC;
`;

const UPDATE_RESTAURANT_RESTNAME_QUERY = `
UPDATE restaurant
      SET restaurant_name = $1
      WHERE id = $2;
`;

const UPDATE_RESTAURANT_ACCNAME_QUERY = `
UPDATE restaurant
      SET account_name = $1
      WHERE id = $2;
`;

const UPDATE_RESTAURANT_ALL_QUERY = `
UPDATE restaurant
      SET account_name = $1, restaurant_name = $2
      WHERE id = $3;
`;

const DELETE_RESTAURANT_QUERY = `
DELETE FROM restaurant
where id = $1;
`;

const RESERVATION_INFO_QUERY = `
SELECT b.id, b.customer_id, c.name, b.branch_id, b.throughout
FROM booking b, customer c
WHERE b.customer_id = c.id;
`;

const UPDATE_RESERVATION_QUERY = `
UPDATE booking
      SET throughout = $1
      WHERE id = $2;
`;

const DELETE_RESERVATION_QUERY = `
DELETE FROM booking
where id = $1;
`;

const BRANCHES_INFO_QUERY = `
SELECT b.id, r.restaurant_name, b.name, b.address, b.plus_code, b.capacity
FROM branch b, RESTAURANT r
where b.restaurant_id = r.id
`;

const BRANCH_DELETE_QUERY = `
DELETE FROM branch
where id = $1
`;

/*
  Login and Dashboard Related
 */
const renderLogin = (req, res, next) => {
    res.render('admin-login', {});
};

const renderDashboard = (req, res, next) => {
    const admin_id = req.cookies.admin;
    pool.query(ADMIN_INFO_QUERY, [admin_id], (err, dbRes) => {
        if (dbRes.rows[0] !== undefined) {
            const { account_name } = dbRes.rows[0];
            res.render('admin-dashboard', {user_name: account_name});
        } else {
            res.send("error!");
        }
    })
};

// Check for admin login
router.get('/', (req, res, next) => {
    if (req.cookies.admin) {
        renderDashboard(req, res, next);
    } else {
        renderLogin(req, res, next);
    }
});

router.get('/dashboard', (req, res, next) => {
    renderDashboard(req, res, next);
});

router.get('/logout', (req, res, next) => {
    res.clearCookie('admin');
    res.redirect('/');
});

// Submit login details. Adds a cookie to store the presence of an admin
router.post('/', (req, res, next) => {
    const { account_name } = req.body;
    // console.log(account_name);
    pool.query(EXISTING_ADMIN_QUERY, [account_name], (err, dbRes) => {
        if (err || dbRes.rows.length !== 1) {
            res.send("error!");
        } else {
            res.cookie('admin', dbRes.rows[0].id) ;
            res.redirect('/admin')
        }
    });
});
/*
  Render Edit User Page
 */

const renderEditUser = (req, res, next) => {
    pool.query(CUSTOMER_INFO_QUERY, (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.render('admin-edit-user', {users: dbRes.rows})
        }
    });
};

/*
  Render Edit Restaurants Page
 */
const renderEditRestaurants = (req, res, next) => {
    pool.query(RESTAURANT_INFO_QUERY, (err, restaurantRes) => {
        if (err) {
            res.send("error!");
        } else {
            pool.query(CUISINES_INFO_QUERY, (err, cuisineRes) => {
              if (err) {
                  console.log(err);
                  res.send("error!");
              } else {
                  pool.query(BRANCHES_INFO_QUERY, (err, branchesRes) => {
                      if(err) {
                          console.log(err);
                          res.send("error!");
                      } else {
                          // console.log(restaurantRes);
                          res.render('admin-edit-restaurants', {
                              restaurants: restaurantRes.rows,
                              restaurant_cuisines: cuisineRes.rows,
                              message: req.flash('info'),
                              branches: branchesRes.rows
                          });
                      }
                  })

              }
            });
        }
    });
};

/*
  Render Edit Reservations Page
 */
const renderEditReservations = (req, res, next) => {
    pool.query(RESERVATION_INFO_QUERY, (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.render('admin-edit-reservations', {reservations: dbRes.rows});
        }
    });
};

/*
  Edit/Delete Users page and form POST requests
 */
router.get('/edit-users', (req, res, next) => {
    renderEditUser(req, res, next);
});

router.post('/delete_user', (req, res, next) => {
    const { user_id } = req.body;
    pool.query(DELETE_CUSTOMER_QUERY, [user_id], (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.redirect('/admin/edit-users')
        }
    });
});

function emptyToNull(str) {
    return (str === "") ? null : str;
}

router.post('/edit_user', (req, res, next) => {
    const new_email = emptyToNull(req.body.new_email);
    const user_id = emptyToNull(req.body.user_id);
    const new_user_name = emptyToNull(req.body.new_user_name);
    const new_password = emptyToNull(req.body.new_password);

    pool.query(UPDATE_USER_QUERY, [user_id, new_user_name, new_password, new_email], (err, dbRes) => {
        if (err) {
            console.log(err);
            res.send("error!");
        } else {
            res.redirect('/admin/edit-users')
        }
    });
});

/*
  Edit/Delete Restaurants page and form POST requests
 */
router.get('/edit-restaurants', (req, res, next) => {
    renderEditRestaurants(req, res, next);
});

// Edit Restaurant details
router.post('/edit_restaurant', (req, res, next) => {
    const { restaurant_id, new_restaurant_account_name, new_restaurant_name } = req.body;
    // console.log(req.body);
    // console.log(new_restaurant_account_name);
    // console.log(new_restaurant_name);
    if (new_restaurant_account_name === '') {
        req.flash('info', 'Successfully updated!');
        pool.query(UPDATE_RESTAURANT_RESTNAME_QUERY, [new_restaurant_name, restaurant_id], (err, dbRes) => {
            if (err) {
                console.log(err);
                res.send("error!");
            } else {
                res.redirect('/admin/edit-restaurants')
            }
        });
    } else if (new_restaurant_name === '') {
        req.flash('info', 'Successfully updated!');
        pool.query(UPDATE_RESTAURANT_ACCNAME_QUERY, [new_restaurant_account_name, restaurant_id], (err, dbRes) => {
            if (err) {
                console.log(err);
                res.send("error!");
            } else {
                res.redirect('/admin/edit-restaurants')
            }
        });
    } else {
        req.flash('info', 'Successfully updated!');
        pool.query(UPDATE_RESTAURANT_ALL_QUERY, [new_restaurant_account_name, new_restaurant_name, restaurant_id], (err, dbRes) => {
            if (err) {
                console.log(err);
                res.send("error!");
            } else {
                res.redirect('/admin/edit-restaurants');
            }
        })
    }
});

// Delete Restaurant
router.post('/delete_restaurant', (req, res, next) => {
    const { restaurant_id } = req.body;
    req.flash('info', 'Successfully deleted!');
    pool.query(DELETE_RESTAURANT_QUERY, [restaurant_id], (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.redirect('/admin/edit-restaurants')
        }
    });
});

/*
  Edit/Delete Reservations page and form POST requests
 */
router.get('/edit-bookings', (req, res, next) => {
    renderEditReservations(req, res, next);
});

router.post('/edit_reservation', (req, res, next) => {
    const { reservation_timing, reservation_id } = req.body;
    req.flash('info', 'Successfully updated!');
    pool.query(UPDATE_RESERVATION_QUERY, [reservation_timing, reservation_id], (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.redirect('/admin/edit-bookings')
        }
    });
});

router.post('/delete_reservation', (req, res, next) => {
    const { reservation_id } = req.body;
    req.flash('info', 'Successfully deleted!');
    pool.query(DELETE_RESERVATION_QUERY, [reservation_id], (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.redirect('/admin/edit-bookings')
        }
    });
});

// Delete Branch
router.post('/delete_branch', (req, res, next) => {
    const { branch_id } = req.body;
    req.flash('info', 'Successfully deleted!');
    pool.query(BRANCH_DELETE_QUERY, [branch_id], (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.redirect('/admin/edit-restaurants')
        }
    });
});


module.exports = router;
