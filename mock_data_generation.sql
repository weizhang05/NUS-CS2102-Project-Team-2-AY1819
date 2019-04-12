-- INSERT CUISINE
INSERT INTO cuisine(name) values('European');
INSERT INTO cuisine(name) values('Italian');
INSERT INTO cuisine(name) values('Thai');

-- INSERT RESTAURANT AND BRANCH
WITH rows AS (
INSERT INTO restaurant(account_name, restaurant_name)
VALUES('pastamania', 'Pasta Mania')
RETURNING id, 'Pasta Mania @ Tampines', 'Tampines Mall', 100
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;
WITH rows AS (
SELECT id, 'Pasta Mania @ Jurong', 'JEM', 100 FROM restaurant r WHERE restaurant_name = 'Pasta Mania'
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;

WITH rows AS (
INSERT INTO restaurant(account_name, restaurant_name)
VALUES('whiterabbit', 'White Rabbit')
RETURNING id, 'White Rabbit @ Harding', 'Harding Road', 100
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;

WITH rows AS (
INSERT INTO restaurant(account_name, restaurant_name)
VALUES('bangkokjam', 'Bangkok Jam')
RETURNING id, 'BKJ @ Bugis', 'Bugis+', 100
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;
WITH rows AS (
SELECT id, 'BKJ @ GWC', 'Great World City', 100 FROM restaurant r WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;
WITH rows AS (
SELECT id, 'BKJ @ Dhoby Ghaut', 'Plaza Singapura', 100 FROM restaurant r WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;

INSERT INTO restaurant(account_name, restaurant_name)
VALUES('abacada', 'Abacada');

-- INSERT RESTAURANT_CUISINE
WITH rows AS (
SELECT r.id as rid, c.id as cid
FROM restaurant r, cuisine c
WHERE r.restaurant_name = 'Pasta Mania' AND c.name = 'Italian'
)
INSERT INTO restaurant_cuisine(restaurant_id, cuisine_id)
SELECT * FROM rows;

WITH rows AS (
SELECT r.id as rid, c.id as cid
FROM restaurant r, cuisine c
WHERE r.restaurant_name = 'White Rabbit' AND c.name = 'European'
)
INSERT INTO restaurant_cuisine(restaurant_id, cuisine_id)
SELECT * FROM rows;

WITH rows AS (
SELECT r.id as rid, c.id as cid
FROM restaurant r, cuisine c
WHERE r.restaurant_name = 'Bangkok Jam' AND c.name = 'Thai'
)
INSERT INTO restaurant_cuisine(restaurant_id, cuisine_id)
SELECT * FROM rows;

-- INSERT CUSTOMER
INSERT INTO customer(name, email, password, non_user)
VALUES('clyde','clyde@email.com','clyde',false),
('a','a@a.a','a',false),
('Joe Biden', 'joe@joe.com', 'joe', 'false'),
('Kamala Harris', 'kamala@kamala.com', 'kamala', 'false'),
('Ellie Goulding', 'ellie@ellie.com', 'ellie', 'false'),
('Kacey Musgraves', 'kacey@kacey.com', 'kacey', 'false'),
('Chris Martin', 'chris@chris.com', 'chris', 'false'),
('Jay Chou', 'jay@jay.com', 'jay', 'false'),
('Roger Federer', 'roger@roger.com', 'roger', 'false'),
('Cheryl', 'cheryl@cheryl.com', 'cheryl', 'false'),
('Bernie Sanders', 'bernie@bernie.com', 'bernie', 'false');

-- INSERT ADMIN
INSERT INTO admins (account_name)
VALUES ('admin1'), ('admin2');

-- INSERT OPEN HRS TEMPLATE
INSERT INTO opening_hours_template (restaurant_id, start_day, start_time, end_day, end_time)
SELECT * FROM (
  SELECT R.id, 6, '22:00'::time, 0, '02:00'::time
  FROM restaurant R
  WHERE R.restaurant_name = 'Abacada'
) I;
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM (
  SELECT id, 'abacada @ Bishan', 'Bishan Some Street', 5
  FROM restaurant R
  WHERE restaurant_name = 'Abacada'
) I;

-- USE TRIGGER FOR OPEN HRS
INSERT INTO customer(name, email, password, non_user)
VALUES('abacada_enthusiaist','abacada_enthusiaist@email.com','abacada_enthusiaist',false);

-- BOOKING ACROSS DEAD HOURS
WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-13T22:20:00', '2019-04-14T01:30:00','[)')
FROM customer c, branch b
WHERE b.name = 'abacada @ Bishan' and c.name = 'abacada_enthusiaist'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

-- INSERT OPENING HRS
WITH rest AS (
SELECT b.id, 0, '10:00'::time, 0, '22:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Pasta Mania @ Jurong'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 1, '10:00'::time, 1, '22:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Pasta Mania @ Jurong'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 2, '10:00'::time, 2, '22:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Pasta Mania @ Jurong'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 3, '10:00'::time, 3, '22:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Pasta Mania @ Jurong'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 4, '10:00'::time, 4, '22:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Pasta Mania @ Jurong'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 5, '10:00'::time, 5, '22:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Pasta Mania @ Jurong'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 6, '10:00'::time, 6, '22:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Pasta Mania @ Jurong'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 0, '12:00'::time, 1, '01:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 1, '12:00'::time, 2, '01:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 2, '12:00'::time, 3, '01:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 3, '12:00'::time, 4, '01:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 4, '12:00'::time, 5, '01:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 5, '12:00'::time, 6, '01:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 6, '12:00'::time, 0, '01:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 0, '09:00'::time, 0, '21:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Dhoby Ghaut'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 1, '09:00'::time, 1, '21:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Dhoby Ghaut'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 2, '09:00'::time, 2, '21:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Dhoby Ghaut'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 3, '09:00'::time, 3, '21:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Dhoby Ghaut'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 4, '09:00'::time, 4, '21:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Dhoby Ghaut'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 5, '09:00'::time, 5, '21:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Dhoby Ghaut'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 6, '09:00'::time, 6, '23:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Dhoby Ghaut'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

-- INSERT BOOKING
WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-14T16:00:00.000Z', '2019-04-14T17:00:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'BKJ @ GWC' and c.name = 'a'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 3, tsrange('2019-04-17T19:00:00.000Z', '2019-04-17T20:00:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'White Rabbit @ Harding' and c.name = 'Cheryl'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-17T19:00:00.000Z', '2019-04-17T20:00:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'White Rabbit @ Harding' and c.name = 'Kamala Harris'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 2, tsrange('2019-04-17T19:00:00.000Z', '2019-04-17T20:00:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'White Rabbit @ Harding' and c.name = 'Kacey Musgraves'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-14T16:00:00.000Z', '2019-04-14T17:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'White Rabbit @ Harding' and c.name = 'clyde'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-14T16:00:00.000Z', '2019-04-14T17:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'BKJ @ Bugis' and c.name = 'Bernie Sanders'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-24T15:00:00.000Z', '2019-04-24T16:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'BKJ @ Dhoby Ghaut' and c.name = 'Bernie Sanders'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-24T10:00:00.000Z', '2019-04-24T12:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'Pasta Mania @ Jurong' and c.name = 'Jay Chou'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-24T11:00:00.000Z', '2019-04-24T12:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'Pasta Mania @ Jurong' and c.name = 'Chris Martin'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-24T11:00:00.000Z', '2019-04-24T12:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'Pasta Mania @ Tampines' and c.name = 'Roger Federer'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-04-28T11:00:00.000Z', '2019-04-28T12:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'Pasta Mania @ Tampines' and c.name = 'Ellie Goulding'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

-- INSERT MENU ITEM
WITH r AS(
SELECT id, 'Carbonara Pasta', 100 from restaurant WHERE restaurant_name = 'Pasta Mania'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Bolognese Pasta', 100 from restaurant WHERE restaurant_name = 'Pasta Mania'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Pesto Pasta', 100 from restaurant WHERE restaurant_name = 'Pasta Mania'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Hawaiian Pizza', 100 from restaurant WHERE restaurant_name = 'Pasta Mania'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Chocolate Banana Pizza', 100 from restaurant WHERE restaurant_name = 'Pasta Mania'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;


WITH item AS (
SELECT r.id, 'Mooncakes', 200 FROM restaurant r WHERE r.restaurant_name = 'White Rabbit'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM item;
WITH item AS (
SELECT r.id, 'Foi Gras', 200 FROM restaurant r WHERE r.restaurant_name = 'White Rabbit'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM item;
WITH item AS (
SELECT r.id, 'Tenderloin', 200 FROM restaurant r WHERE r.restaurant_name = 'White Rabbit'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM item;
WITH item AS (
SELECT r.id, 'Sirloin', 200 FROM restaurant r WHERE r.restaurant_name = 'White Rabbit'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM item;
WITH item AS (
SELECT r.id, 'Wagyu Burger', 200 FROM restaurant r WHERE r.restaurant_name = 'White Rabbit'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM item;
WITH item AS (
SELECT r.id, 'Lobster Bisque', 200 FROM restaurant r WHERE r.restaurant_name = 'White Rabbit'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM item;

WITH r AS(
SELECT id, 'Boat Noodle', 100 from restaurant WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Mango Sticky Rice', 100 from restaurant WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Green Curry', 100 from restaurant WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Seafood Tomyum', 100 from restaurant WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;
WITH r AS(
SELECT id, 'Basil Pork Rice', 100 from restaurant WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO menu_item(restaurant_id, name, cents)
SELECT * FROM r;

-- INSERT RATINGS
INSERT into rating(customer_id, branch_id, rating_value)
VALUES((SELECT id FROM customer where customer.name = 'Kamala Harris'),
       (SELECT id FROM branch where branch.name = 'White Rabbit @ Harding'), 4);

INSERT into rating(customer_id, branch_id, rating_value)
VALUES((SELECT id FROM customer where customer.name = 'Kacey Musgraves'),
       (SELECT id FROM branch where branch.name = 'White Rabbit @ Harding'), 5);

INSERT into rating(customer_id, branch_id, rating_value)
VALUES((SELECT id FROM customer where customer.name = 'Bernie Sanders'),
       (SELECT id FROM branch where branch.name = 'BKJ @ Dhoby Ghaut'), 1);

INSERT into rating(customer_id, branch_id, rating_value)
VALUES((SELECT id FROM customer where customer.name = 'Bernie Sanders'),
       (SELECT id FROM branch where branch.name = 'BKJ @ Bugis'), 2);

INSERT into rating(customer_id, branch_id, rating_value)
       VALUES((SELECT id FROM customer where customer.name = 'Roger Federer'),
       (SELECT id FROM branch where branch.name = 'Pasta Mania @ Tampines'), 3);

INSERT into rating(customer_id, branch_id, rating_value)
       VALUES((SELECT id FROM customer where customer.name = 'Ellie Goulding'),
       (SELECT id FROM branch where branch.name = 'Pasta Mania @ Tampines'), 3);

INSERT into rating(customer_id, branch_id, rating_value)
       VALUES((SELECT id FROM customer where customer.name = 'Jay Chou'),
       (SELECT id FROM branch where branch.name = 'Pasta Mania @ Jurong'), 2);

INSERT into rating(customer_id, branch_id, rating_value)
       VALUES((SELECT id FROM customer where customer.name = 'Chris Martin'),
       (SELECT id FROM branch where branch.name = 'Pasta Mania @ Tampines'), 3);