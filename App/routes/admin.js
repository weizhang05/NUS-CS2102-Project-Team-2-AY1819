let express = require('express');
let pool = require('../pool');
let router = express.Router();

// queries
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
SELECT id, name
FROM customer
`;

const DELETE_CUSTOMER_QUERY = `
DELETE FROM customer
WHERE id = $1;
`;

const UPDATE_USER_QUERY = `
UPDATE customer
      SET name = $1
      WHERE id = $2;
`;

const renderLogin = (req, res, next) => {
  res.render('admin-login', {});
};

const renderDashboard = (req, res, next) => {
  const admin_id = req.cookies.admin;
  pool.query(ADMIN_INFO_QUERY, [admin_id], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      const { account_name } = dbRes.rows[0];
      res.render('admin-dashboard', {user_name: account_name});
    }
  })
};

const renderEditUser = (req, res, next) => {
  pool.query(CUSTOMER_INFO_QUERY, (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.render('admin-edit-user', {users: dbRes.rows})
    }
  });
};

const renderEditRestaurents = (req, res, next) => {
  // TODO: generate list of all restaurents & feed into page
  // have simple UI for "edit restaurent", "delete restaurent" & more?
  res.render('admin-edit-restaurents')
};

const renderEditReservations = (req, res, next) => {
  // TODO: ???
  res.render('admin-edit-reservations')
};

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

// login
router.post('/', (req, res, next) => {
  const { account_name } = req.body;
  console.log(account_name);
  pool.query(EXISTING_ADMIN_QUERY, [account_name], (err, dbRes) => {
    if (err || dbRes.rows.length !== 1) {
      res.send("error!");
    } else {
      res.cookie('admin', dbRes.rows[0].id) ;
      res.redirect('/admin')
    }
  });
});

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

router.post('/edit_user', (req, res, next) => {
  const { user_id, new_user_name } = req.body;
  console.log(req.body);
  console.log(new_user_name);
  pool.query(UPDATE_USER_QUERY, [new_user_name, user_id], (err, dbRes) => {
    if (err) {
      console.log(err);
      res.send("error!");
    } else {
      res.redirect('/admin/edit-users')
    }
  });
});

module.exports = router;
