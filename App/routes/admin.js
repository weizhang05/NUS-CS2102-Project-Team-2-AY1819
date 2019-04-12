let express = require('express');
let pool = require('../pool');
let router = express.Router();

const cuisineRouter = require('./cuisine');
const branchRouter = require('./branch');

router.use('/cuisine', cuisineRouter);
router.use('/edit-restaurants/branch', branchRouter);
const queries = require('../public/scripts/admin_sql_queries');

// TODO: some preprocessing to make input more user-friendly
// TODO: standardize booking and reservation

/*
  Login and Dashboard Related
 */
const renderLogin = (req, res, next) => {
    res.render('admin-login', {});
};

const renderDashboard = (req, res, next) => {
    const admin_id = req.cookies.admin;
    pool.query(queries.ADMIN_INFO_QUERY, [admin_id], (err, dbRes) => {
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
    res.redirect('/admin');
});

// Submit login details. Adds a cookie to store the presence of an admin
router.post('/', (req, res, next) => {
    const { account_name } = req.body;
    // console.log(account_name);
    pool.query(queries.EXISTING_ADMIN_QUERY, [account_name], (err, dbRes) => {
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
    pool.query(queries.CUSTOMER_INFO_QUERY, (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.render('admin-edit-user', {users: dbRes.rows,
                                            message: req.flash('info')})
        }
    });
};

/*
  Render Edit Restaurants Page
 */
const renderEditRestaurants = (req, res, next) => {
    pool.query(queries.RESTAURANT_INFO_QUERY, (err, restaurantRes) => {
        if (err) {
            res.send("error!");
        } else {
            pool.query(queries.CUISINES_INFO_QUERY, (err, cuisineRes) => {
                if (err) {
                    console.log(err);
                    res.send("error!");
                } else {
                    pool.query(queries.BRANCHES_INFO_QUERY, (err, branchesRes) => {
                        if(err) {
                            console.log(err);
                            res.send("error!");
                        } else {
                            pool.query(queries.MENU_ITEM_QUERY, (err, menuRes) => {
                                if (err) {
                                    console.log(err);
                                    res.send("error!");
                                } else {
                                    pool.query(queries.MENU_ITEM_OVERRIDE_QUERY, (err, mOverrideRes) => {
                                        if (err) {
                                            console.log(err);
                                            res.send("error_override!");
                                        } else {
                                            res.render('admin-edit-restaurants', {
                                                restaurants: restaurantRes.rows,
                                                restaurant_cuisines: cuisineRes.rows,
                                                message: req.flash('info'),
                                                branches: branchesRes.rows,
                                                menu_items: menuRes.rows,
                                                menu_item_override: mOverrideRes.rows
                                            });
                                        }
                                    });
                                }
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
    pool.query(queries.RESERVATION_INFO_QUERY, (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            res.render('admin-edit-reservations', {reservations: dbRes.rows,
                                                   message: req.flash('info')});
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
    pool.query(queries.DELETE_CUSTOMER_QUERY, [user_id], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-users')
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully updated!');
            res.redirect('/admin/edit-users')
        }
    });
});

function emptyToNull(str) {
    return (str === "") ? null : str;
}

router.post('/add_user', (req, res, next) => {
    const user_name = emptyToNull(req.body.user_name);
    const email = emptyToNull(req.body.email);
    const password = emptyToNull(req.body.password);

    pool.query(queries.ADD_USER_QUERY, [user_name, email, password], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-users')
            // console.log(err);
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully updated!');
            res.redirect('/admin/edit-users')
        }
    });

})

router.post('/edit_user', (req, res, next) => {
    const new_email = emptyToNull(req.body.new_email);
    const user_id = emptyToNull(req.body.user_id);
    const new_user_name = emptyToNull(req.body.new_user_name);
    const new_password = emptyToNull(req.body.new_password);

    if (new_email != null && new_user_name == null && new_password == null) {
        pool.query(queries.UPDATE_USER_QUERY_EMAIL, [user_id, new_email], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-users')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-users')
            }
        });
    } else if (new_email == null && new_user_name != null && new_password == null) {
        pool.query(queries.UPDATE_USER_QUERY_NAME, [user_id, new_user_name], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-users')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-users')
            }
        });
    } else if (new_email == null && new_user_name == null && new_password != null) {
        pool.query(queries.UPDATE_USER_QUERY_PASSWORD, [user_id, new_password], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-users')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-users')
            }
        });
    } else if (new_email != null && new_user_name != null && new_password == null) {
        pool.query(queries.UPDATE_USER_QUERY_NAME_EMAIL, [user_id, new_user_name, new_email], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-users')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-users')
            }
        });
    } else if (new_email != null && new_user_name == null && new_password != null) {
        pool.query(queries.UPDATE_USER_QUERY_PASSWORD_EMAIL, [user_id, new_email, new_password], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-users')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-users')
            }
        });
    } else if (new_email == null && new_user_name != null && new_password != null) {
        pool.query(queries.UPDATE_USER_QUERY_NAME_PASSWORD, [user_id, new_user_name, new_password], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-users')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-users')
            }
        });
    } else {
        pool.query(queries.UPDATE_USER_QUERY_ALL, [user_id, new_user_name, new_email, new_password], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-users')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-users')
            }
        });
    }
});

/*
  Edit/Delete Restaurants page and form POST requests
 */
router.get('/edit-restaurants', (req, res, next) => {
    renderEditRestaurants(req, res, next);
});

router.post('/add_restaurant', (req, res, next) => {
    const add_restaurant_account_name = emptyToNull(req.body.add_restaurant_account_name);
    const add_restaurant_name = emptyToNull(req.body.add_restaurant_name);
    pool.query(queries.ADD_RESTAURANT_QUERY, [add_restaurant_account_name, add_restaurant_name], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-restaurants')
            // console.log(err);
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully updated!');
            res.redirect('/admin/edit-restaurants')
        }
    });
})

// Edit Restaurant details
router.post('/edit_restaurant', (req, res, next) => {
    const { restaurant_id, new_restaurant_account_name, new_restaurant_name } = req.body;
    // console.log(req.body);
    // console.log(new_restaurant_account_name);
    // console.log(new_restaurant_name);
    if (new_restaurant_account_name === '') {

        pool.query(queries.UPDATE_RESTAURANT_RESTNAME_QUERY, [new_restaurant_name, restaurant_id], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-restaurants')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-restaurants')
            }
        });
    } else if (new_restaurant_name === '') {

        pool.query(queries.UPDATE_RESTAURANT_ACCNAME_QUERY, [new_restaurant_account_name, restaurant_id], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-restaurants')
                // console.log(err);
                // res.send("error!");
            } else {
                req.flash('info', 'Successfully updated!');
                res.redirect('/admin/edit-restaurants')
            }
        });
    } else {
        req.flash('info', 'Successfully updated!');
        pool.query(queries.UPDATE_RESTAURANT_ALL_QUERY, [new_restaurant_account_name, new_restaurant_name, restaurant_id], (err, dbRes) => {
            if (err) {
                req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
                res.redirect('/admin/edit-restaurants')
                // console.log(err);
                // res.send("error!");
            } else {
                res.redirect('/admin/edit-restaurants');
            }
        })
    }
});

// Delete Restaurant
router.post('/delete_restaurant', (req, res, next) => {
    const { restaurant_id } = req.body;

    pool.query(queries.DELETE_RESTAURANT_QUERY, [restaurant_id], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-restaurants')
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully deleted!');
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

    pool.query(queries.UPDATE_RESERVATION_QUERY, [reservation_timing, reservation_id], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-bookings')
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully updated!');
            res.redirect('/admin/edit-bookings')
        }
    });
});

router.post('/delete_reservation', (req, res, next) => {
    const { reservation_id } = req.body;

    pool.query(queries.DELETE_RESERVATION_QUERY, [reservation_id], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-bookings')
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully deleted!');
            res.redirect('/admin/edit-bookings')
        }
    });
});

// Add Branch
router.post('/add_branch', (req, res, next) => {
    const add_branch_restaurant_id = emptyToNull(req.body.add_branch_restaurant_id);
    const add_branch_name = emptyToNull(req.body.add_branch_name);
    const add_branch_address = emptyToNull(req.body.add_branch_address);
    const add_branch_pluscode = emptyToNull(req.body.add_branch_pluscode);
    const add_branch_capacity = emptyToNull(req.body.add_branch_capacity);

    pool.query(queries.ADD_BRANCH_QUERY, [add_branch_restaurant_id, add_branch_name, add_branch_address, add_branch_pluscode, add_branch_capacity], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-restaurants')
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully updated!');
            res.redirect('/admin/edit-restaurants')
        }
    });


});


// Edit Branch
router.post('/edit_branch', (req, res, next) => {
    const edit_branch_id = emptyToNull(req.body.edit_branch_id);
    res.redirect(`/admin/edit-restaurants/branch/${edit_branch_id}/edit`);
});

// Delete Branch
router.post('/delete_branch', (req, res, next) => {
    const { branch_id } = req.body;

    pool.query(queries.BRANCH_DELETE_QUERY, [branch_id], (err, dbRes) => {
        if (err) {
            req.flash('info', 'Update failed! Please ensure you are keying in valid values for input.');
            res.redirect('/admin/edit-restaurants')
            // res.send("error!");
        } else {
            req.flash('info', 'Successfully deleted!');
            res.redirect('/admin/edit-restaurants')
        }
    });
});

// Add Menu Item
router.post('/new_menu_item', (req, res, next) => {
    const { restaurant_id, menu_item_name, menu_item_cents } = req.body;
    // console.log(req.body);
    pool.query(queries.NEW_MENU_ITEM,
        [restaurant_id, menu_item_name, menu_item_cents], (err, _) => {
        if (err) {
            console.log(err);
            res.send("error!");
        } else {
            req.flash('info', 'Successfully added!');
            res.redirect('/admin/edit-restaurants')
        }
    });
});

// Delete Menu Item
router.post('/delete_menu_item/:itemId', (req, res, next) => {
    const { itemId } = req.params;
    console.log(itemId);
    pool.query(queries.DELETE_MENU_ITEM_QUERY, [itemId], (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            req.flash('info', 'Successfully deleted menu item!');
            res.redirect('/admin/edit-restaurants')
        }
    });
});

// Add Menu Item Override
router.post('/new_menu_item_override', (req, res, next) => {
    const {branch_id, menu_item_name, menu_item_cents} = req.body;
    // console.log(req.body);
    pool.query(queries.NEW_MENU_ITEM_OVERRIDE,
        [branch_id, menu_item_name, menu_item_cents], (err, _) => {
            if (err) {
                console.log(err);
                res.send("error!");
            } else {
                req.flash('info', 'Successfully added menu item override!');
                res.redirect('/admin/edit-restaurants')
            }
        });
});

// Delete Menu Item Override
router.post('/delete_menu_item_override/:itemId', (req, res, next) => {
    const { itemId } = req.params;
    pool.query(queries.DELETE_MENU_ITEM_OVERRIDE, [itemId], (err, dbRes) => {
        if (err) {
            res.send("error!");
        } else {
            req.flash('info', 'Successfully deleted menu item override!');
            res.redirect('/admin/edit-restaurants')
        }
    });
});

/*
 Statistics Related Routing
 */
router.get('/statistics', (req, res, next) => {
    renderStatistics(req, res, next);
});

const renderStatistics = (req, res, next) => {
    pool.query(queries.STATS_RESTAURANT_CUISINE_COUNT, (err, cuisineCountRes) => {
        if (err) {
            res.send("error!");
        } else {
            pool.query(queries.STATS_MOST_BOOKED_RESTAURANT, (err, bookingCountRes) => {
                if (err) {
                    res.send("error!");
                } else {
                    pool.query(queries.STATS_POPULAR_BOOKING_TIME, (err, popularTimingRes) => {
                        if (err) {
                            res.send("error!");
                        } else {
                            res.render('admin-statistics', {
                                cuisineCount: cuisineCountRes.rows,
                                bookingCount: bookingCountRes.rows,
                                popularTiming: popularTimingRes.rows,
                                message: req.flash('info'),
                            });
                        }
                    });
                }
            });
        }
    })
};


module.exports = router;
