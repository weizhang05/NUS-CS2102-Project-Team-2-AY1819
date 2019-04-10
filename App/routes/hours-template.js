const express = require('express');
const pool = require('../pool');
const router = express.Router();

const NEW_OPEN_HOURS = `
INSERT INTO opening_hours_template (restaurant_id, start_day, start_time, end_day, end_time)
VALUES ($1, $2, $3, $4, $5);
`;

const DELETE_OPEN_HOURS = `
DELETE FROM opening_hours_template
WHERE id = $1 AND restaurant_id = $2;
`;

// note: hoursId is ignored
router.post('/:hoursId/new', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
  const { start_day, start_time, end_day, end_time } = req.body;
  pool.query(NEW_OPEN_HOURS, [restaurant_id, start_day, start_time, end_day, end_time], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      console.log(dbRes);
      res.redirect('/restaurants');
    }
  });
});

router.post('/:hoursId/delete', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
  const { hoursId } = req.params;
  pool.query(DELETE_OPEN_HOURS, [hoursId, restaurant_id], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect('/restaurants');
    }
  });
});

module.exports = router;