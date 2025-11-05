-- Task 4.1.1
set enable_seqscan to on;
set enable_indexscan to on;
set enable_bitmapscan to on;

-- Index and sequential scans enabled
EXPLAIN ANALYZE 
SELECT * FROM FILM WHERE film_id < 100;

EXPLAIN ANALYZE 
SELECT * FROM FILM WHERE film_id >= 100;
