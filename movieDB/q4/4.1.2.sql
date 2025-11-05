-- Index scans enabled and sequential scans suppressed
set enable_seqscan to off;
set enable_indexscan to on;
set enable_bitmapscan to on;

EXPLAIN ANALYZE 
SELECT * FROM FILM WHERE film_id < 100;

EXPLAIN ANALYZE 
SELECT * FROM FILM WHERE film_id >= 100;

set enable_seqscan to on;
