INSERT INTO cuisine(name) values('chinese');
INSERT INTO cuisine(name) values('italian');

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

INSERT INTO customer(name, email, password, non_user) VALUES('clyde','clyde@email.com','clyde',false);

INSERT INTO admins (account_name)
  VALUES ('admin1'), ('admin2');

