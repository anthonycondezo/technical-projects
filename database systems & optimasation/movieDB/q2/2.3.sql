-- TASK 2.3: 

DROP INDEX IF EXISTS idx_boat;

-- Performance before creating index
EXPLAIN ANALYZE
SELECT title
FROM FILM
WHERE POSITION('Boat' IN description) > 0
ORDER BY title
LIMIT 10;

-- creating index
CREATE INDEX idx_boat
ON FILM (POSITION('Boat' IN description), title);

-- Performance after creating index
EXPLAIN ANALYZE
SELECT title
FROM FILM
WHERE POSITION('Boat' IN description) > 0
ORDER BY title
LIMIT 10;
