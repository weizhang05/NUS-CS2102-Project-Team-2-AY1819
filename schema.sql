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
DROP TABLE IF EXISTS operating_hours_override cascade;

CREATE TABLE restaurant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name varchar(100) NOT NULL UNIQUE,
  restaurant_name varchar(100) NOT NULL
);

-- rationale for separate cuisine table:
-- useful for extension; e.g. if we want to associate to each
-- cuisine in future a thumbnail image for that cuisine, or
-- a hierarchy of specificity
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

CREATE TABLE menu_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurant ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  cents integer NOT NULL CHECK (cents >= 0),
  UNIQUE (restaurant_id, name)
);

CREATE TABLE menu_item_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branch NOT NULL,
  name varchar(100) NOT NULL,
  -- when cents is negative, this means that the override removes a
  -- menu item that would otherwise be displayed
  cents integer NOT NULL CHECK (cents >= -1),
  UNIQUE (branch_id, name)
);

CREATE TABLE branch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurant ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  -- Addresses not necessarily unique: consider hawker stalls.
  address text NOT NULL,
  -- a plus_code is a compact universal geolocation identifier
  -- plus_code arguably dependent only on address. However, it
  --   poses user problems when a restauranteur assigns a wrong
  --   plus_code to an address and another restauranteur wishes
  --   to use another plus code for the same address. Thus
  --   in the context of this app,
  --   (restaurant_id, address) -> plus_code
  plus_code varchar(10),
  -- Question: how do we properly capture capacity constraint
  --   that may be due to walk-in or bookings outside the
  --   the system?
  capacity integer NOT NULL,
  -- see https://plus.codes/
  -- location not strictly necessary for now
  UNIQUE (restaurant_id, address)
);

CREATE TABLE opening_hours_template (
  -- semantics: start_day = 0 is Sunday, 6 is Saturday
  -- if (start_day, start_time) > (end_day, end_time), that means
  -- it's open through Saturday 2359.
  -- Start day/time is inclusive, end day/time is exclusive, unless
  -- end time is XX59.
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurant ON DELETE CASCADE,
  start_day integer NOT NULL,
  start_time time NOT NULL,
  end_day integer NOT NULL,
  end_time time NOT NULL,
  CHECK (start_day >= 0 AND start_day < 7),
  CHECK (end_day >= 0 AND end_day < 7)
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

-- Note limitation: only one interval per date
CREATE TABLE operating_hours_override (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branch NOT NULL,
  override_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  UNIQUE (branch_id, override_date)
);

CREATE FUNCTION null_if_overlap_opening_hours_template()
RETURNS trigger AS
$$
BEGIN
IF EXISTS (SELECT * FROM opening_hours_template T WHERE
  T.restaurant_id = NEW.restaurant_id AND (
  (
    -- condition: range of given existing row does not have sat midnight in interior
    --            and range of new row does not have sat midnight in interior
    ((T.start_day < T.end_day) OR (T.start_day = T.end_day AND T.start_time <= T.end_time))
    AND
    ((NEW.start_day < NEW.end_day) OR (NEW.start_day = NEW.end_day AND NEW.start_time <= NEW.end_time))
    AND NOT
    (
      -- either existing row is before new row
      (T.end_day < NEW.start_day) OR (T.end_day = NEW.start_day AND T.end_time < NEW.start_time)
      -- or new row is before existing row
      OR
      (NEW.end_day < T.start_day) OR (NEW.end_day = T.start_day AND NEW.end_time < T.start_time)
    )
  )
  OR
  (
    -- condition: range of given existing row has sat midnight in interior
    --            and range of new row does not have sat midnight in interior
    ((T.end_day < T.start_day) OR (T.end_day = T.start_day AND T.end_time < T.start_time))
    AND
    ((NEW.start_day < NEW.end_day) OR (NEW.start_day = NEW.end_day AND NEW.start_time <= NEW.end_time))
    AND NOT (
    -- range of new row must be after the range of existing row ends...
    ((T.end_day < NEW.start_day) OR (T.end_day = NEW.start_day AND T.end_time < NEW.start_time))
    AND
    -- and before the range of existing row starts.
    ((NEW.end_day < T.start_day) OR (NEW.end_day = T.start_day AND NEW.end_time < T.start_time))
    )
  )
  OR
  (
    -- condition: range of given existing row does not have sat midnight in interior
    --            and range of new row has sat midnight in interior
    ((T.start_day < T.end_day) OR (T.start_day = T.end_day AND T.start_time <= T.end_time))
    AND
    ((NEW.end_day < NEW.start_day) OR (NEW.end_day = NEW.start_day AND NEW.end_time < NEW.start_time))
    -- same conditions as previous case
    AND NOT (
    ((NEW.end_day < T.start_day) OR (NEW.end_day = T.start_day AND NEW.end_time < T.start_time))
    AND
    ((T.end_day < NEW.start_day) OR (T.end_day = NEW.start_day AND T.end_time < NEW.start_time))
    )
  )
  -- if range of new row and given existing row both have sat midnight in interior, they certainly overlap
  OR
  (
    -- condition: range of new row has sat midnight in interior
    --            and range of given existing row has sat midnight in interior
    ((T.end_day < T.start_day) OR (T.end_day = T.start_day AND T.end_time < T.start_time))
    AND
    ((NEW.end_day < NEW.start_day) OR (NEW.end_day = NEW.start_day AND NEW.end_time < NEW.start_time))
  )
  )
)
THEN
  RETURN NULL;
ELSE
  RETURN NEW;
END IF;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER no_overlaps_opening_hours_template BEFORE INSERT
ON opening_hours_template
FOR ROW
EXECUTE PROCEDURE null_if_overlap_opening_hours_template();

CREATE FUNCTION insert_hours_from_template()
RETURNS trigger AS
$$
BEGIN
INSERT INTO opening_hours (branch_id, start_day, start_time, end_day, end_time)
SELECT NEW.id, T.start_day, T.start_time, T.end_day, T.end_time
FROM opening_hours_template T
WHERE T.restaurant_id = NEW.restaurant_id;
RETURN NEW;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER copy_hours_from_template_upon_create_branch AFTER INSERT
ON branch
FOR ROW
EXECUTE PROCEDURE insert_hours_from_template();

CREATE FUNCTION null_if_overlap_opening_hours()
RETURNS trigger AS
$$
BEGIN
IF EXISTS (SELECT * FROM opening_hours T WHERE
  T.branch_id = NEW.branch_id
  AND (
  (
    -- condition: range of given existing row does not have sat midnight in interior
    --            and range of new row does not have sat midnight in interior
    ((T.start_day < T.end_day) OR (T.start_day = T.end_day AND T.start_time <= T.end_time))
    AND
    ((NEW.start_day < NEW.end_day) OR (NEW.start_day = NEW.end_day AND NEW.start_time <= NEW.end_time))
    AND NOT
    (
      -- either existing row is before new row
      (T.end_day < NEW.start_day) OR (T.end_day = NEW.start_day AND T.end_time < NEW.start_time)
      -- or new row is before existing row
      OR
      (NEW.end_day < T.start_day) OR (NEW.end_day = T.start_day AND NEW.end_time < T.start_time)
    )
  )
  OR
  (
    -- condition: range of given existing row has sat midnight in interior
    --            and range of new row does not have sat midnight in interior
    ((T.end_day < T.start_day) OR (T.end_day = T.start_day AND T.end_time < T.start_time))
    AND
    ((NEW.start_day < NEW.end_day) OR (NEW.start_day = NEW.end_day AND NEW.start_time <= NEW.end_time))
    AND NOT (
    -- range of new row must be after the range of existing row ends...
    ((T.end_day < NEW.start_day) OR (T.end_day = NEW.start_day AND T.end_time < NEW.start_time))
    AND
    -- and before the range of existing row starts.
    ((NEW.end_day < T.start_day) OR (NEW.end_day = T.start_day AND NEW.end_time < T.start_time))
    )
  )
  OR
  (
    -- condition: range of given existing row does not have sat midnight in interior
    --            and range of new row has sat midnight in interior
    ((T.start_day < T.end_day) OR (T.start_day = T.end_day AND T.start_time <= T.end_time))
    AND
    ((NEW.end_day < NEW.start_day) OR (NEW.end_day = NEW.start_day AND NEW.end_time < NEW.start_time))
    -- same conditions as previous case
    AND NOT (
    ((NEW.end_day < T.start_day) OR (NEW.end_day = T.start_day AND NEW.end_time < T.start_time))
    AND
    ((T.end_day < NEW.start_day) OR (T.end_day = NEW.start_day AND T.end_time < NEW.start_time))
    )
  )
  -- if range of new row and given existing row both have sat midnight in interior, they certainly overlap
  OR
  (
    -- condition: range of new row has sat midnight in interior
    --            and range of given existing row has sat midnight in interior
    ((T.end_day < T.start_day) OR (T.end_day = T.start_day AND T.end_time < T.start_time))
    AND
    ((NEW.end_day < NEW.start_day) OR (NEW.end_day = NEW.start_day AND NEW.end_time < NEW.start_time))
  )
  )
)
THEN
  RETURN NULL;
ELSE
  RETURN NEW;
END IF;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER no_overlaps_opening_hours BEFORE INSERT
ON opening_hours
FOR ROW
EXECUTE PROCEDURE null_if_overlap_opening_hours();

-- ensure duration >= 1hr
-- ensure start time > now
-- ensure booking start < booking end
CREATE OR REPLACE FUNCTION booking_duration_check()
RETURNS trigger AS
$$
BEGIN
  IF upper(NEW.throughout) - lower(NEW.throughout) < '1 hour'::interval
    OR isempty(NEW.throughout)
    OR lower(NEW.throughout) < current_timestamp
  THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END
$$
language plpgsql;

CREATE TRIGGER booking_duration_check
BEFORE INSERT OR UPDATE
ON booking
FOR EACH ROW
EXECUTE PROCEDURE booking_duration_check();

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

-- menu item price must be >= 0
CREATE OR REPLACE FUNCTION validate_menu_item()
RETURNS trigger AS
$$
BEGIN
  IF NEW.cents < 0
  THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$
language plpgsql;

CREATE TRIGGER validate_menu_item
BEFORE INSERT OR UPDATE
ON menu_item
FOR EACH ROW
EXECUTE PROCEDURE validate_menu_item();

CREATE FUNCTION max_in_interval(branch_id uuid, during tsrange)
RETURNS integer AS
$$
DECLARE
  current_occupancy integer := 0;
  max_occupancy integer := 0;
  current_row record;
BEGIN
  FOR current_row IN (
    SELECT T.ts AS ts, T.d_pax AS d_pax
    FROM (
      SELECT lower(B.throughout) AS ts, B.pax AS d_pax
      FROM booking B
      WHERE B.branch_id = max_in_interval.branch_id
      AND B.throughout && max_in_interval.during
      UNION
      SELECT upper(B.throughout) AS ts, -B.pax AS d_pax
      FROM booking B
      WHERE B.branch_id = max_in_interval.branch_id
      AND B.throughout && max_in_interval.during
    ) T
    ORDER BY T.ts, T.d_pax ASC
  ) LOOP
    current_occupancy := current_occupancy + current_row.d_pax;
    IF current_occupancy > max_occupancy THEN
      max_occupancy := current_occupancy;
    END IF;
  END LOOP;
  RETURN max_occupancy;
END;
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION valid_new_booking(branch_id uuid, during tsrange, pax integer)
RETURNS boolean AS
$$
DECLARE
  low_ts timestamp := lower(during);
  up_ts timestamp := upper(during);
  low_ts_time time := low_ts::time;
  up_ts_time time := low_ts::time;
  low_ts_day integer := EXTRACT(DOW FROM low_ts);
  up_ts_day integer := EXTRACT(DOW FROM up_ts);
BEGIN
  IF (
    pax + max_in_interval(valid_new_booking.branch_id, during) <= (SELECT B.capacity FROM branch B WHERE B.id = valid_new_booking.branch_id)
    AND (
      (
        EXISTS (SELECT * FROM operating_hours_override O WHERE O.branch_id = valid_new_booking.branch_id AND O.override_date = low_ts::date AND O.override_date = up_ts::date AND O.start_time <= low_ts_time AND O.end_time >= up_ts_time)
      )
      OR
      (
        NOT EXISTS (SELECT * FROM operating_hours_override O WHERE O.branch_id = valid_new_booking.branch_id AND (O.override_date = low_ts::date OR O.override_date = up_ts::date))
        AND EXISTS (
          SELECT *
          FROM opening_hours O
          WHERE O.branch_id = valid_new_booking.branch_id
          AND (
            (
              (O.start_day < O.end_day OR (O.start_day = O.end_day AND O.start_time <= O.end_time))
              AND
              (O.start_day < low_ts_day OR (O.start_day = low_ts_day AND O.start_time <= low_ts_time))
              AND
              (up_ts_day < O.end_day OR (up_ts_day = O.end_day AND up_ts_time <= O.end_time))
            )
            OR
            (
              (O.end_day < O.start_day OR (O.end_day = O.start_day AND O.end_time < O.start_time))
              AND
              (
                (
                  (O.start_day < low_ts_day OR (O.start_day = low_ts_day AND O.start_time <= low_ts_time))
                  AND
                  (low_ts_day < up_ts_day OR (low_ts_day = up_ts_day AND low_ts_time < up_ts_time))
                )
                OR
                (
                  (O.start_day < low_ts_day OR (O.start_day = low_ts_day AND O.start_time <= low_ts_time))
                  AND
                  (up_ts_day < O.end_day OR (up_ts_day = O.end_day AND up_ts_time <= O.end_time))
                )
                OR
                (
                  (low_ts_day < up_ts_day OR (low_ts_day = up_ts_day AND low_ts_time < up_ts_time))
                  AND
                  (up_ts_day < O.end_day OR (up_ts_day = O.end_day AND up_ts_time <= O.end_time))
                )
              )
            )
          )
        )
      )
    )
  )
  THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$
LANGUAGE plpgsql;

CREATE FUNCTION validate_new_booking_trigger_fn()
RETURNS trigger AS
$$
BEGIN
  IF valid_new_booking(NEW.branch_id, NEW.throughout, NEW.pax)
  THEN
    RETURN NEW;
  ELSE
    RETURN NULL;
  END IF;
END;
$$
LANGUAGE plpgsql;

CREATE TRIGGER validate_booking
BEFORE INSERT OR UPDATE
ON booking
FOR ROW
EXECUTE PROCEDURE validate_new_booking_trigger_fn();