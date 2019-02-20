CREATE EXTENSION "pgcrypto";
CREATE EXTENSION "btree_gist";

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
  restaurant_id uuid REFERENCES restaurant NOT NULL,
  name varchar(100) NOT NULL,
  cents integer NOT NULL,
  UNIQUE (restaurant_id, name)
);

CREATE TABLE branch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurant NOT NULL,
  -- Question: how do we properly capture capacity constraint
  --   that may be due to walk-in or bookings outside the
  --   the system?
  capacity integer NOT NULL,
  -- see https://plus.codes/
  -- location not strictly necessary for now
  plus_code varchar(10),
  address text NOT NULL,
  monday_start time NOT NULL,
  monday_end time NOT NULL,
  tuesday_start time NOT NULL,
  tuesday_end time NOT NULL,
  wednesday_start time NOT NULL,
  wednesday_end time NOT NULL,
  thursday_start time NOT NULL,
  thursday_end time NOT NULL,
  friday_start time NOT NULL,
  friday_end time NOT NULL,
  saturday_start time NOT NULL,
  saturday_end time NOT NULL,
  UNIQUE (restaurant_id, address)
);

CREATE TABLE customer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL
);

CREATE TABLE booking (
  -- capture operating hours constraint
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- we want to preserve bookings even if the restaurant/branch
  -- no longer exists
  customer_id uuid REFERENCES customer NOT NULL,
  branch_id uuid REFERENCES branch,
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
