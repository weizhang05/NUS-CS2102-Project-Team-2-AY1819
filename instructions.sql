-- CREATE NEW ACC:
INSERT INTO customer (name, email, password, non_user)
Values (....);

-- LOGIN:
-- check if username exists
SELECT 1 FROM customer where email = 'someemail';
-- check if password is correct
SELECT 1 FROM customer where email = 'someemail', password = 'some_pass';

-- DELETE USER: (no need to cascade)
DELETE FROM customer where email = 'someemail';

-- MAKE BOOKING:
-- compare number of bookings & capacity in code
SELECT COUNT(*) FROM bookings b 
WHERE b.branchid = 'someplace'
AND b.throught <@ tsrange('session_start', 'session_end', '[)');

SELECT capacity from branch where branch.id = 'somebranch';

-- if its ok to insert
INSERT INTO booking VALUES
('id', 'customer_id', 'details', 'branch_id', '[rangestart, end)');

-- DELETE BOOKING:
DELETE FROM booking where booking.id = 'someid';

-- GET USER BOOKINGS:
SELECT * from booking where customer_id = 'someid';

-- GET AVAILABILITY FOR THE DAY:
-- To show availability in calendar view (MR2)
