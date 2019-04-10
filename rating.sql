DROP TABLE IF EXISTS rating cascade;

CREATE TABLE rating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customer ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branch ON DELETE CASCADE,
  rating_value integer NOT NULL CONSTRAINT rating_limits CHECK (rating_value >= 1 AND rating_value <= 5),
  UNIQUE (customer_id, branch_id)
);