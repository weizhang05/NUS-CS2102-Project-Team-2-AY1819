CREATE EXTENSION "pgcrypto";
CREATE EXTENSION "btree_gist";

DROP TABLE IF EXISTS restaurant cascade;
DROP TABLE IF EXISTS restaurant_cuisine cascade;
DROP TABLE IF EXISTS cuisine cascade;
DROP TABLE IF EXISTS menu_item cascade;
DROP TABLE IF EXISTS branch cascade;
DROP TABLE IF EXISTS opening_hours;
DROP TABLE IF EXISTS customer cascade;
DROP TABLE IF EXISTS admins cascade;
DROP TABLE IF EXISTS booking cascade;
DROP TABLE IF EXISTS menu_item_override cascade;
DROP TABLE IF EXISTS operating_override cascade;

CREATE TABLE restaurant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name varchar(100) NOT NULL UNIQUE,
  restaurant_name varchar(100) NOT NULL
);

-- rationale for separate cuisine table;
-- a restaurant may offer multiple cuisines
CREATE TABLE cuisine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL UNIQUE
);

CREATE TABLE restaurant_cuisine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant NOT NULL,
  cuisine_id uuid REFERENCES cuisine NOT NULL,
  UNIQUE(restaurant_id, cuisine_id)
);

-- possible alternative implementation: Markdown?
CREATE TABLE menu_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurant ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  cents integer NOT NULL,
  UNIQUE (restaurant_id, name)
);

CREATE TABLE branch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurant ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  address text NOT NULL,
  plus_code varchar(10),
  -- Question: how do we properly capture capacity constraint
  --   that may be due to walk-in or bookings outside the
  --   the system?
  capacity integer NOT NULL,
  -- see https://plus.codes/
  -- location not strictly necessary for now
  UNIQUE (restaurant_id, address)
);

CREATE TABLE opening_hours (
  -- semantics: start_day = 0 is Sunday, 6 is Saturday
  -- if (start_day, start_time) > (end_day, end_time), that means
  -- it's open through Saturday 2359.
  -- Start day/time is inclusive, end day/time is exclusive, unless
  -- end time is XX59.
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branch ON DELETE CASCADE,
  start_day integer NOT NULL,
  start_time time NOT NULL,
  end_day integer NOT NULL,
  end_time time NOT NULL,
  CHECK (start_day >= 0 AND start_day < 7),
  CHECK (end_day >= 0 AND end_day < 7)
);

CREATE TABLE customer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  -- to identify if the customer entity is a user of the system
  -- used to identify call-in bookings
  non_user bool NOT NULL
);

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name varchar(100) NOT NULL
);

CREATE TABLE booking (
  -- capture operating hours constraint
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- we want to preserve bookings even if the restaurant/branch
  -- no longer exists
  customer_id uuid REFERENCES customer NOT NULL,
  branch_id uuid REFERENCES branch,
  pax integer NOT NULL,
  throughout tsrange NOT NULL,
  -- TODO: determine if this exclusion contraint does what I think it
  --   does and actually 
  EXCLUDE USING gist (customer_id WITH =, throughout WITH &&)
);

-- tables below not used for milestone 1

CREATE TABLE menu_item_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branch NOT NULL,
  name varchar(100) NOT NULL,
  -- when cents is negative, this means that the override removes a
  -- menu item that would otherwise be displayed
  cents integer NOT NULL,
  UNIQUE (branch_id, name)
);

CREATE TABLE operating_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branch NOT NULL,
  override_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  UNIQUE (branch_id, override_date)
);

-- trigger for cleaning up cuisines
-- restauranters directly add restaurant_cuisine & indirectly, cuisines
-- use trigger to clean up cuisines when resturant_cuisines are deleted
CREATE OR REPLACE FUNCTION cleanup_cuisine()
RETURNS trigger AS
$$
DECLARE count NUMERIC;
BEGIN
  SELECT count(*) INTO count
  FROM restaurant_cuisine rc
  WHERE OLD.cuisine_id = rc.cuisine_id;
  IF count = 0 THEN
    DELETE FROM cuisine
    WHERE cuisine.id = OLD.cuisine_id;
  END IF;
  RETURN NEW;
END;
$$
language plpgsql;

CREATE TRIGGER cleanup_cuisine
AFTER DELETE ON restaurant_cuisine
FOR EACH ROW
EXECUTE PROCEDURE cleanup_cuisine();
