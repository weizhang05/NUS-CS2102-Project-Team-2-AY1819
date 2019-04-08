-- INSERT CUISINE
INSERT INTO cuisine(name) values('european');
INSERT INTO cuisine(name) values('italian');

-- INSERT RESTAURANT AND BRANCH
WITH rows AS (
INSERT INTO restaurant(account_name, restaurant_name) VALUES('pastamania', 'Pasta Mania')
RETURNING id, restaurant_name, 'somewhere', 100
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;

WITH rows AS (
INSERT INTO restaurant(account_name, restaurant_name) VALUES('whiterabbit', 'White Rabbit')
RETURNING id, restaurant_name, 'somewhere', 100
)
INSERT INTO branch(restaurant_id, name, address, capacity)
SELECT * FROM rows;

-- INSERT RESTAURANT_CUISINE
WITH rows AS (
SELECT r.id as rid, c.id as cid FROM restaurant r, cuisine c WHERE r.restaurant_name = 'Pasta Mania' AND c.name = 'italian'
)
INSERT INTO restaurant_cuisine(restaurant_id, cuisine_id)
SELECT * FROM rows;

WITH rows AS (
SELECT r.id as rid, c.id as cid FROM restaurant r, cuisine c WHERE r.restaurant_name = 'White Rabbit' AND c.name = 'european'
)
INSERT INTO restaurant_cuisine(restaurant_id, cuisine_id)
SELECT * FROM rows;

-- INSERT CUSTOMER
INSERT INTO customer(name, email, password, non_user) VALUES('clyde','clyde@email.com','clyde',false);

INSERT INTO admins (account_name)
  VALUES ('admin1'), ('admin2');


INSERT INTO customer(name, email, password, non_user) VALUES('mabel','mabel@email.com','mabel',false);