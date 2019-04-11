const express = require('express');
const pool = require('../pool');
const router = express.Router();

// create cuisine if it does not exist,
// then retrieve id
const INSERT_OR_RETRIEVE_CUISINE = `
WITH val(name) AS (VALUES ($1)),
ins AS (
  INSERT INTO cuisine(name)
  SELECT * FROM val
  ON CONFLICT (name) DO NOTHING
  RETURNING id, name
  )
SELECT COALESCE(ins.id, cui.id) as id
FROM val
LEFT JOIN ins on ins.name = val.name
LEFT JOIN cuisine cui ON cui.name = val.name
`;

const NEW_RESTAURANT_CUISINE = `
INSERT INTO restaurant_cuisine (restaurant_id, cuisine_id)
VALUES ($1, $2)
`;

const DELETE_CUISINE = `
DELETE FROM cuisine
WHERE id = $1
`;

const DELETE_RESTAURANT_CUISINE = `
DELETE FROM restaurant_cuisine
WHERE id = $1 
`;


function insert_restaurant_cuisine(req, res, restaurant_id, cuisine_id) {
  pool.query(NEW_RESTAURANT_CUISINE, [restaurant_id, cuisine_id], (err, _) => {
    if (err) {
      console.log(err);
      res.send("error_inserting_restaurant_cuisine!");
    } else {
      req.flash('info', 'Successfully added!');
      redirect(req, res);
    }
  });
}

// note: restaurant_id is ignored if user is not an admin
router.post('/:restaurant_id/new', (req, res, next) => {
  const { restaurant_id: r_id, cuisine_name } = req.body;
  const restaurant_id = (req.cookies.admin !== undefined) ? r_id : req.cookies.restaurants;
  console.log(req.cookies);

  console.log(cuisine_name);
  // get cuisine id, if does not exist, create
  // insert restaurant_cuisine
  pool.query(INSERT_OR_RETRIEVE_CUISINE, [cuisine_name], (err, dbRes) => {
    if (err) {
      console.log(cuisine_name);
      console.log(err);
      res.send("error inserting/retriving cuisine");
    } else {
      const cuisine_id = dbRes.rows[0].id;
      insert_restaurant_cuisine(req, res, restaurant_id, cuisine_id)
    }
  });
});

router.post('/:itemId/delete', (req, res, next) => {
  const { itemId } = req.params;
  pool.query(DELETE_RESTAURANT_CUISINE, [itemId], (err, _) => {
    if (err) {
      console.log(err);
      res.send("error!");
    } else {
      redirect(req, res);
    }
  });
});

function redirect(req, res) {
  // bad code here... shouldn't be hardcoded
  if (req.cookies.admin === undefined) {
    res.redirect("/restaurants");
  } else {
    res.redirect("/admin/edit-restaurants")
  }
}

module.exports = router;
