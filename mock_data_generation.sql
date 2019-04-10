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
SELECT id, 'Jurong @ Pasta Mania', 'JEM', 100 FROM restaurant r WHERE restaurant_name = 'Pasta Mania'
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
SELECT id, 'BKJ @ Doby Ghout', 'Plaza Singapura', 100 FROM restaurant r WHERE restaurant_name = 'Bangkok Jam'
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;

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
('a','a@a.a','a',false);

-- INSERT ADMIN
INSERT INTO admins (account_name)
VALUES ('admin1'), ('admin2');

-- INSERT BOOKING HRS
WITH rest AS (
SELECT b.id, 0, '08:00'::time, 1, '10:00'::time
FROM branch b
WHERE b.name = 'Pasta Mania @ Tampines' OR b.name = 'Jurong @ Pasta Mania'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;	

WITH rest AS (
SELECT b.id, 0, '12:00'::time, 1, '12:00'::time
FROM branch b
WHERE b.name = 'White Rabbit @ Harding'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

WITH rest AS (
SELECT b.id, 0, '08:00'::time, 1, '10:00'::time
FROM branch b
WHERE b.name = 'BKJ @ Bugis' OR b.name = 'BKJ @ GWC' OR b.name = 'BKJ @ Doby Ghout'
)
INSERT INTO opening_hours(branch_id, start_day, start_time, end_day, end_time)
SELECT * FROM rest;

-- INSERT BOOKING
WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-05-14T16:00:00.000Z', '2019-05-14T17:00:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'BKJ @ GWC' and c.name = 'a'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

WITH item AS (
SELECT c.id, b.id, 1, tsrange('2019-05-14T16:00:00.000Z', '2019-05-14T17:30:00.000Z','[)')
FROM customer c, branch b
WHERE b.name = 'White Rabbit @ Harding' and c.name = 'clyde'
)
INSERT INTO booking(customer_id, branch_id, pax, throughout)
SELECT * FROM item;

-- tables below not used for milestone 1
