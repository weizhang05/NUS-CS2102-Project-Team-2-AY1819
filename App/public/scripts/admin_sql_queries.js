var express = require('express');
var router = express.Router();

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
UPDATE customer
      SET name = $1
      WHERE id = $2;
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

const STATS_RESTAURANT_CUISINE_COUNT = `
WITH CombinedTable
as (select c.name as cuisine
    from cuisine c join restaurant_cuisine rc on c.id = rc.cuisine_id)

SELECT cuisine, count(*) as count
FROM CombinedTable ct
GROUP BY cuisine
ORDER BY count desc
`

const STATS_MOST_BOOKED_RESTAURANT = `
WITH CombinedTable
as (SELECT br.name as branch_name, r.restaurant_name as restaurant_name
    FROM branch br join booking bo on br.id = bo.branch_id, restaurant r
    WHERE r.id = br.restaurant_id)

SELECT branch_name, restaurant_name, count(*) as count
FROM CombinedTable
GROUP BY branch_name, restaurant_name;
`

const STATS_POPULAR_BOOKING_TIME = `
SELECT lower(throughout)::time as time_list, br.name as branch_name, count(*) as booking_count
FROM booking b, branch br
WHERE b.branch_id = br.id
group by lower(throughout)::time, branch_name
order by branch_name, booking_count desc;
`

module.exports = {
    STATS_POPULAR_BOOKING_TIME,
    STATS_RESTAURANT_CUISINE_COUNT,
    STATS_MOST_BOOKED_RESTAURANT,
    BRANCH_DELETE_QUERY,
    BRANCHES_INFO_QUERY,
    DELETE_RESERVATION_QUERY,
    UPDATE_RESERVATION_QUERY,
    DELETE_RESTAURANT_QUERY,
    RESERVATION_INFO_QUERY,
    RESTAURANT_INFO_QUERY,
    UPDATE_RESTAURANT_RESTNAME_QUERY,
    ADMIN_INFO_QUERY,
    CUISINES_INFO_QUERY,
    CUSTOMER_INFO_QUERY,
    DELETE_CUSTOMER_QUERY,
    EXISTING_ADMIN_QUERY,
    UPDATE_RESTAURANT_ACCNAME_QUERY,
    UPDATE_USER_QUERY,
    UPDATE_RESTAURANT_ALL_QUERY
};