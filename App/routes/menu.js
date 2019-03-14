const express = require('express');
const pool = require('../pool');
const router = express.Router();

const NEW_MENU_ITEM = `
INSERT INTO menu_item (restaurant_id, name, cents)
VALUES ($1, $2, $3);
`;

const DELETE_MENU_ITEM = `
DELETE FROM menu_item
WHERE id = $1 AND restaurant_id = $2;
`;

// note: itemId is ignored.
router.post('/:itemId/new', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
  const { name, price } = req.body;
  const cents = price.replace(/\./g, "");
  pool.query(NEW_MENU_ITEM, [restaurant_id, name, cents], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect("/restaurants");
    }
  });
});

// note: itemId is ignored.
router.post('/:itemId/delete', (req, res, next) => {
  const restaurant_id = req.cookies.restaurants;
  const { itemId } = req.params;
  pool.query(DELETE_MENU_ITEM, [itemId, restaurant_id], (err, dbRes) => {
    if (err) {
      res.send("error!");
    } else {
      res.redirect("/restaurants");
    }
  });
});

module.exports = router;