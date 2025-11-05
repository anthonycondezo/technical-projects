-- Index scans suppressed and sequential scans enabled
set enable_seqscan to on;
set enable_indexscan to off;
set enable_bitmapscan to off;

EXPLAIN ANALYZE 
SELECT * FROM FILM WHERE film_id < 100;

EXPLAIN ANALYZE 
SELECT * FROM FILM WHERE film_id >= 100;

set enable_indexscan to on;
set enable_bitmapscan to on;
