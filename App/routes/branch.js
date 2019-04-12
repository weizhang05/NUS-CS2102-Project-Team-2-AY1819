const express = require('express');
const pool = require('../pool');
const router = express.Router();

const BRANCH_QUERY = `
SELECT id, name, address, plus_code, capacity
FROM branch
WHERE id = $1;
`;

const NEW_BRANCH_WITHOUT_PLUS_CODE = `
INSERT INTO branch (restaurant_id, name, address, capacity)
VALUES ($1, $2, $3, $4);
`;

const NEW_BRANCH_WITH_PLUS_CODE = `
INSERT INTO branch (restaurant_id, name, address, plus_code, capacity)
VALUES ($1, $2, $3, $4, $5);
`;

const EDIT_BRANCH_WITH_PLUS_CODE = `
UPDATE branch
SET name = $2, address = $3, plus_code = $4, capacity = $5
WHERE id = $1;
`;

const EDIT_BRANCH_WITHOUT_PLUS_CODE = `
UPDATE branch
SET name = $2, address = $3, plus_code = NULL, capacity = $4
WHERE id = $1;
`;

const DELETE_BRANCH = `
DELETE FROM branch
WHERE id = $1 AND restaurant_id = $2;
`;

const OPEN_HOURS_QUERY = `
SELECT id, branch_id, start_day, start_time, end_day, end_time
FROM opening_hours
WHERE branch_id = $1
ORDER BY (start_day, start_time) ASC;
`;

const NEW_OPEN_HOURS = `
INSERT INTO opening_hours (branch_id, start_day, start_time, end_day, end_time)
VALUES ($1, $2, $3, $4, $5);
`;

// pseudo-authentication; correct auth out of scope of project:
// assume query is not invoked for those who are not authorized to
// invoke query for given branch_id
const DELETE_OPEN_HOURS = `
DELETE FROM opening_hours
WHERE id = $1 AND branch_id = $2;
`;

const NEW_OPERATING_HOURS_OVERRIDE = `
INSERT INTO operating_hours_override (branch_id, override_date, start_time, end_time)
VALUES ($1, $2, $3, $4);
`;

const OPERATING_HOURS_OVERRIDE_QUERY = `
SELECT id, override_date, start_time, end_time
FROM operating_hours_override
WHERE branch_id = $1
`;

const DELETE_OPERATING_HOURS_OVERRIDE = `
DELETE FROM operating_hours_override
WHERE id = $1 AND branch_id = $2;
`

const NEW_MENU_ITEM_OVERRIDE = `
INSERT INTO menu_item_override (branch_id, name, cents)
VALUES ($1, $2, $3);
`;

const MENU_ITEM_OVERRIDE_QUERY = `
SELECT id, name, cents
FROM menu_item_override
WHERE branch_id = $1
`;

const DELETE_MENU_ITEM_OVERRIDE = `
DELETE FROM menu_item_override
WHERE id = $1 AND branch_id = $2;
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

function getRestaurantId(req) {
  // WARNING: admins don't actually have restaurant id in the body yet
  return (req.cookies.restaurants) ? req.cookies.restaurants : req.body.restaurant_id;
}

// for requests reusable by admin
function redirect_branch_edit(req, res, branch_id) {
  const dest = (req.cookies.restaurants)
    ? `/restaurants/branch/${branch_id}/edit`
    : `/admin/edit-restaurants/branch/${branch_id}/edit`;
  res.redirect(dest);
}

// note: branchId is ignored.
router.get('/:branchId/new', (req, res, next) => {
  res.render('restaurants-branch-new');
});

// note: branchId is ignored.
router.post('/:branchId/new', (req, res, next) => {
  const restaurant_id = getRestaurantId(req);
  const { name, address, plus_code, capacity } = req.body;
  if (plus_code) {
    pool.query(NEW_BRANCH_WITH_PLUS_CODE, [restaurant_id, name, address, plus_code, capacity], (err, dbRes) => {
      if (err) {
        res.send("error!");
      } else {
        res.redirect("/restaurants");
      }
    });
  } else {
    pool.query(NEW_BRANCH_WITHOUT_PLUS_CODE, [restaurant_id, name, address, capacity], (err, dbRes) => {
      if (err) {
        res.send("error!");
      } else {
        res.redirect("/restaurants");
      }
    });
  }
});

router.get('/:branchId/edit', (req, res, next) => {
  const { branchId } = req.params;
  pool.query(BRANCH_QUERY, [branchId], (err, dbRes) => {
    if (err) {
      res.send("error!");
      console.log(err);
    } else {
      const { id, name, address, plus_code, capacity } = dbRes.rows[0];

      pool.query(OPEN_HOURS_QUERY, [branchId], (err, dbHoursRes) => {
        if (err) {
          res.send("error!");
          console.log(err);
        } else {
          const hours = dbHoursRes.rows;
          pool.query(OPERATING_HOURS_OVERRIDE_QUERY, [branchId], (err, dbHoursOverrideRes) => {
            if (err) {
              res.send("error!");
              console.log(err);
            } else {
              const hours_override = dbHoursOverrideRes.rows;
              pool.query(MENU_ITEM_OVERRIDE_QUERY, [branchId], (err, dbMenuItemOverrideRes) => {
                if (err) {
                  res.send("error!")
                  console.log(err);
                } else {
                  const menu_override = dbMenuItemOverrideRes.rows;
                  const branch_ejs = (req.cookies.restaurants)
                    ? 'restaurants-branch-edit'
                    : 'admin-branch-edit';

                  res.render(branch_ejs, {
                    branchId,
                    name,
                    address,
                    plus_code,
                    capacity,
                    hours,
                    intToDayStr,
                    hours_override,
                    menu_override,
                  });
                }
              });
            }
          });
        }
      });
    }
  });
});

router.post('/:branchId/edit', (req, res, next) => {
  const { branch_id, name, address, plus_code, capacity } = req.body;
  if (plus_code) {
    pool.query(EDIT_BRANCH_WITH_PLUS_CODE, [branch_id, name, address, plus_code, capacity], (err, dbRes) => {
      if (err) {
        res.send("error!");
      } else {
        res.redirect("/restaurants");
      }
    });
  } else {
    pool.query(EDIT_BRANCH_WITHOUT_PLUS_CODE, [branch_id, name, address, capacity], (err, dbRes) => {
      if (err) {
        res.send("error!");
      } else {
        res.redirect("/restaurants");
      }
    });
  }
});

router.post('/:branchId/delete', (req, res, next) => {
  const restaurant_id = getRestaurantId(req);
  const { branchId } = req.params;
  pool.query(DELETE_BRANCH, [branchId, restaurant_id], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect("/restaurants");
    }
  });
});

// note: hoursId is ignored
router.post('/:branchId/hours/:hoursId/new', (req, res, next) => {
  const { branchId } = req.params;
  const { start_day, start_time, end_day, end_time } = req.body;
  pool.query(NEW_OPEN_HOURS, [branchId, start_day, start_time, end_day, end_time], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      redirect_branch_edit(req, res, branchId);
    }
  });
});

router.post('/:branchId/hours/:hoursId/delete', (req, res, next) => {
  const { branchId, hoursId } = req.params;
  pool.query(DELETE_OPEN_HOURS, [hoursId, branchId], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      redirect_branch_edit(req, res, branchId);
    }
  });
});

// note: hoursId is ignored
router.post('/:branchId/hours-override/:hoursId/new', (req, res, next) => {
  const branchId = req.params.branchId;
  const { override_date, start_time, end_time } = req.body;
  console.log(override_date);
  pool.query(NEW_OPERATING_HOURS_OVERRIDE, [branchId, override_date, start_time, end_time], (err, dbRes) => {
    if (err) {
      res.send("error!");
      console.log(err);
    } else {
      redirect_branch_edit(req, res, branchId);
    }
  });
});

router.post('/:branchId/hours-override/:hoursId/delete', (req, res, next) => {
  const { branchId, hoursId } = req.params;
  pool.query(DELETE_OPERATING_HOURS_OVERRIDE, [hoursId, branchId], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      redirect_branch_edit(req, res, branchId);
    }
  });
});


// note: itemId is ignored.
router.post('/:branchId/menu-override/:itemId/new', (req, res, next) => {
  const { branchId } = req.params;
  console.log(req.body);
  const { name, price, disable } = req.body;
  const dotted_price = price.includes('.') ? price : price + '.';
  // Note: no validation provided.
  const [ dollars, cents ] = dotted_price.split('.');
  const cents_padded = cents.padEnd(2, '0').slice(0, 2);
  const value_in_cents = disable === 'on' ? "-1" : dollars + cents_padded;
  console.log(value_in_cents);
  pool.query(NEW_MENU_ITEM_OVERRIDE, [branchId, name, value_in_cents], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      redirect_branch_edit(req, res, branchId);
    }
  });
});

// note: itemId is ignored.
router.post('/:branchId/menu-override/:itemId/delete', (req, res, next) => {
  const { branchId } = req.params;
  const { itemId } = req.params;
  pool.query(DELETE_MENU_ITEM_OVERRIDE, [itemId, branchId], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      redirect_branch_edit(req, res, branchId);
    }
  });
});

module.exports = router;
