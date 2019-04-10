DROP TABLE IF EXISTS rating cascade;

CREATE TABLE rating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customer ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES branch ON DELETE CASCADE,
  rating integer NOT NULL CONSTRAINT rating_limits CHECK (rating >= 1 AND rating <= 5),
  UNIQUE (customer_id, branch_id)
);