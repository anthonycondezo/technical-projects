-- TODO: double check lecture on calculating the
--       actual expected cost of runtime.

-- TODO: double check to also check the run time for 
--       select statement in the CREATE MATERIALIZED VIEW
--       statement too. I expect it to be identical to 
--       that of the virtual view

-- Virtual View Performance
EXPLAIN ANALYZE
SELECT * FROM V_HR_MU_2010_ACTORS;

-- Materialized View Performance
EXPLAIN ANALYZE 
SELECT * FROM MV_HR_MU_2010_ACTORS;
