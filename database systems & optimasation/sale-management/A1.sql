-- A1
-- By Anthony Condezo
-- s4648130


-- #### Question 1

-- Question 1.1
-- Shows all constraints successfully added to the database
SELECT
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    pg_get_constraintdef(pc.oid) AS search_condition
FROM
    information_schema.table_constraints AS tc
JOIN
    pg_constraint AS pc ON tc.constraint_name = pc.conname
WHERE
    tc.constraint_schema = 'public';


-- Question 1.2
-- Constraints included: pk_staffno, pk_deptno and pk_customerno
-- Adding missing constraints

-- Constraint 3: Primary Key
ALTER TABLE SALES
ADD CONSTRAINT pk_saleno PRIMARY KEY (saleno);

-- Constraint 5: Unique Constraint
ALTER TABLE DEPT
ADD CONSTRAINT un_dname UNIQUE (dname);

-- Constraint 6: Not empty
ALTER TABLE STAFF
ADD CONSTRAINT ck_staffname CHECK (staffname IS NOT NULL);

-- Constraint 7: Not empty
ALTER TABLE DEPT
ADD CONSTRAINT ck_dname CHECK (dname IS NOT NULL);

-- Constraint 8: Not empty
ALTER TABLE CUSTOMER
ADD CONSTRAINT ck_cname CHECK (cname IS NOT NULL);

-- Constraint 9: Not empty
ALTER TABLE SALES
ADD CONSTRAINT ck_receiptno CHECK (receiptno IS NOT NULL);

-- Constraint 10: Amount must be positive
ALTER TABLE SALES
ADD CONSTRAINT ck_amount CHECK (amount > 0); 

-- Constraint 11: Ensure position is one of the following valid values
ALTER TABLE STAFF
ADD CONSTRAINT ck_position
CHECK (position IN (
        'Group Manager',
        'Group Assistant',
        'Group Member',
        'Team Leader',
        'Branch Manager'
) AND position IS NOT NULL);

-- Constraint 12: Ensure servicetype is one of the following valid values
ALTER TABLE SALES
ADD CONSTRAINT ck_servicetype
CHECK (servicetype IN (
    'Software Installation',
    'Software Repair',
    'Training',
    'Consultation',
    'Data Recovery'
) AND servicetype IS NOT NULL);

-- Constraint 13: Ensure paymenttype is one of the following valid values
ALTER TABLE SALES
ADD CONSTRAINT ck_paymenttype
CHECK (paymenttype IN (
    'Debit',
    'Cash',
    'Credit'
) AND paymenttype IS NOT NULL);

-- Constraint 14: Ensure that GST si either 'yes' or 'no'
ALTER TABLE SALES
ADD CONSTRAINT ck_gst CHECK (gst IN ('Yes', 'No') AND gst IS NOT NULL);

-- Constraint 15: Foreign Key
ALTER TABLE STAFF
ADD CONSTRAINT fk_deptno
FOREIGN KEY (deptno) REFERENCES DEPT(deptno);

-- Constraint 16: Foreign Key
ALTER TABLE SALES
ADD CONSTRAINT fk_staffno
FOREIGN KEY (servedby) REFERENCES STAFF(staffno);

-- Constraint 17: Foreign Key
ALTER TABLE SALES
ADD CONSTRAINT fk_customerno
FOREIGN KEY (customerno) REFERENCES CUSTOMER(customerno);


-- #### Quesiton 2
-- Question 2.1
-- Creating a sequence that starts from 10,000
CREATE SEQUENCE PNO_SEQ
    INCREMENT 1
    START WITH 10000;



-- Question 2.2:
-- Creating user function UDF_BI_PNO and trigger BI_PNO

-- Use sequence PNO_SEQ to generate the next saleno value
CREATE OR REPLACE FUNCTION UDF_BI_PNO()
RETURNS TRIGGER AS $$
BEGIN
    NEW.saleno := nextval('pno_seq');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Binding the trigger to SALES with UDF_BI_PNO()
CREATE TRIGGER BI_PNO
BEFORE INSERT ON SALES
FOR EACH ROW
EXECUTE FUNCTION UDF_BI_PNO();



-- Question 2.3: 
-- Creating user function UDF_TOP_DISCOUNT and trigger TOP_DISCOUNT

-- Defining udf to enforce the 15% discount for the current 
-- top customer
CREATE OR REPLACE FUNCTION UDF_TOP_DISCOUNT()
RETURNS TRIGGER AS $$
DECLARE
    top_customerno INTEGER;
BEGIN
    -- Returns a table of total amount for each customer in SALES
    -- Getting the customerno of the highest paying customer
    WITH customer_totals AS (
        SELECT customerno, SUM (amount) AS total_amount
        FROM SALES
        GROUP BY customerno
    )
    SELECT customerno
    INTO top_customerno
    FROM customer_totals
    WHERE total_amount = (
        SELECT MAX (total_amount)
        FROM customer_totals
    );

    -- apply 15% discount on amount for current top customer
    IF top_customerno = NEW.customerno THEN
        NEW.amount := NEW.amount * 0.85;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Binding the trigger to SALES with UDF_TOP_DISCOUNT()
CREATE TRIGGER TOP_DISCOUNT
BEFORE INSERT ON SALES
FOR EACH ROW
EXECUTE FUNCTION UDF_TOP_DISCOUNT();



-- Question 2.4:

-- Defining udf to update paymenttype of 'Cash' and a 30%
-- discount for all 'Data Recovery' servicetypes ONLY
-- for new purchases made by staffmemebers from 'SALES - Sunshine'
CREATE OR REPLACE FUNCTION UDF_SUNSHINE_DEPT()
RETURNS TRIGGER AS $$
DECLARE
    sunshine_dname VARCHAR(20) := 'SALES - Sunshine';
    sunshine_deptno SMALLINT;
BEGIN
    -- checking that the provided paymenttype doesn't violate ck_paymenttype
    IF NEW.paymenttype NOT IN ( 'Debit', 'Cash', 'Credit') 
        OR NEW.paymenttype IS NULL THEN
        RAISE EXCEPTION 'new row for relation "sales" violates check constraint "ck_paymenttype"';
        RETURN NULL;
    END IF;

    -- Getting deptno for 'SALES - Sunshine'
    SELECT deptno
    INTO sunshine_deptno
    FROM DEPT
    WHERE dname = sunshine_dname;

    -- Checking if NEW SALE insert was made by a staff memeber from
    -- 'SALES - Sunshine'
    IF EXISTS (
        WITH sunshine_staff AS (
            SELECT staffno FROM STAFF
            WHERE deptno = sunshine_deptno
        )
        SELECT 1
        FROM sunshine_staff
        WHERE staffno = NEW.servedby
    ) THEN
        -- sunshine_staff is a single column containing all staffno
        -- of all staff memebers from 'SALES - Sunshine'
        NEW.paymenttype := 'Cash'; -- update payment type

        -- apply Sunshine exclusive 30% discount
        IF NEW.servicetype = 'Data Recovery' THEN
            NEW.amount := NEW.amount * 0.70;
        END IF;
    END IF;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;

-- Binding the trigger to SALES with UDF_SUNSHINE_DEPT()
CREATE TRIGGER SUNSHINE_DEPT
BEFORE INSERT ON SALES
FOR EACH ROW
EXECUTE FUNCTION UDF_SUNSHINE_DEPT();

-- Question 2.5: 
CREATE OR REPLACE FUNCTION UDF_TIME_CHECK()
RETURNS TRIGGER AS $$
DECLARE
    prev_position VARCHAR(20); -- staff member who served the customer's
                               -- previous purchase
    prev_location VARCHAR(50); -- the location of the customer's previous purchase
    prev_time TIMESTAMP; -- time of previous purchase

    new_location VARCHAR(50); -- location of NEW insert into SALES
    new_position VARCHAR(20); -- staff member who served the NEW insert into SALES
BEGIN
    -- getting info from most recent purchase
    SELECT position, dlocation, saletime
    INTO prev_position, prev_location, prev_time
    FROM SALES
    JOIN STAFF ON SALES.servedby = STAFF.staffno
    JOIN DEPT ON DEPT.deptno = STAFF.deptno
    WHERE customerno = NEW.customerno
        AND saletime::date = NEW.saletime::date
    ORDER BY SALES.saletime DESC
    LIMIT 1;

    -- getting new_position AND new_location
    SELECT position, dlocation
    INTO new_position, new_location
    FROM STAFF
    JOIN DEPT ON STAFF.deptno = DEPT.deptno
    WHERE STAFF.staffno = NEW.servedby;

    -- preventing a new purchase as one was already made 5 minutes prior
    -- in another DIFFERENT location
    IF prev_time IS NOT NULL 
        -- if prev_time is NULL, first pruchase, skip this check
        AND NEW.saletime - prev_time < INTERVAL '5 minutes'
        AND new_location <> prev_location THEN
        RETURN NULL;
    END IF;

    -- preventing a new purchase outside of trading hours by a staff member
    -- in a NON-manager position
    IF (NEW.saletime::time < TIME '06:00:00'
        OR NEW.saletime::time > TIME '21:00:00')
        AND new_position NOT LIKE '%Manager%' THEN
        RETURN NULL;
    END IF;

    RETURN NEW;

END;
$$ LANGUAGE plpgsql;


-- Bindin the trigger to SALES with UDF_TIME_CHECK()
CREATE TRIGGER TIME_CHECK
BEFORE INSERT ON SALES
FOR EACH ROW
EXECUTE FUNCTION UDF_TIME_CHECK();
