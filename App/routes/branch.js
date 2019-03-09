const express = require('express');
const pool = require('../pool');
const router = express.Router();

const BRANCH_QUERY = `
SELECT id, name, address, plus_code, capacity
FROM branch
WHERE id = $1 AND restaurant_id = $2;
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
SET name = $3, address = $4, plus_code = $5, capacity = $6
WHERE id = $1 AND restaurant_id = $2;
`;

const EDIT_BRANCH_WITHOUT_PLUS_CODE = `
UPDATE branch
SET name = $3, address = $4, plus_code = NULL, capacity = $5
WHERE id = $1 AND restaurant_id = $2;
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

const DELETE_OPEN_HOURS = `
DELETE FROM opening_hours
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

// note: branchId is ignored.
router.get('/:branchId/new', (req, res, next) => {
  res.render('restaurants-branch-new');
});

// note: branchId is ignored.
router.post('/:branchId/new', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
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
  const restaurant_id = req.cookies.restaurants;
  pool.query(BRANCH_QUERY, [req.params.branchId, restaurant_id], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      const { id, name, address, plus_code, capacity } = dbRes.rows[0];
      pool.query(OPEN_HOURS_QUERY, [req.params.branchId], (err, dbHoursRes) => {
        if (err) {
          res.send("error!");
        } else {
          const hours = dbHoursRes.rows;
          res.render('restaurants-branch-edit', {
            branchId: req.params.branchId,
            restaurant_id,
            name,
            address,
            plus_code,
            capacity,
            hours,
            intToDayStr
          });
        }
      });
    }
  });
});

router.post('/:branchId/edit', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
  const { branch_id, name, address, plus_code, capacity } = req.body;
  if (plus_code) {
    pool.query(EDIT_BRANCH_WITH_PLUS_CODE, [branch_id, restaurant_id, name, address, plus_code, capacity], (err, dbRes) => {
      if (err) {
        res.send("error!");
      } else {
        res.redirect("/restaurants");
      }
    });
  } else {
    pool.query(EDIT_BRANCH_WITHOUT_PLUS_CODE, [branch_id, restaurant_id, name, address, capacity], (err, dbRes) => {
      if (err) {
        res.send("error!");
      } else {
        res.redirect("/restaurants");
      }
    });
  }
});

router.post('/:branchId/delete', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
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
  const restaurant_id = req.cookies.restaurants;
  const { branch_id, start_day, start_time, end_day, end_time } = req.body;
  pool.query(NEW_OPEN_HOURS, [branch_id, start_day, start_time, end_day, end_time], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect(`/restaurants/branch/${branch_id}/edit`);
    }
  });
});

router.post('/:branchId/hours/:hoursId/delete', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
  const { branchId, hoursId } = req.params;
  pool.query(DELETE_OPEN_HOURS, [hoursId, branchId], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect(`/restaurants/branch/${branchId}/edit`);
    }
  });
});

module.exports = router;
