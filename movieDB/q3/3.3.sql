-- Performance before creating index
DROP INDEX IF EXISTS idx_year;
DROP INDEX IF EXISTS idx_rate; 
DROP INDEX IF EXISTS idx_feature;

EXPLAIN ANALYZE
SELECT SUM(group_count) AS total
FROM (
    SELECT COUNT(*) AS group_count
    FROM FILM
    GROUP BY release_year, rating, special_features
)
WHERE group_count > 40;

-- (B) without GROUP BY clause
EXPLAIN ANALYZE
SELECT COUNT(*) AS total
FROM FILM F1
WHERE (
    SELECT COUNT(*)
    FROM FILM F2
    WHERE F1.release_year = F2.release_year
        AND F1.rating = F2.rating
        AND F1.special_features = F2.special_features
) > 40;

-- create the following indexes on the film table
-- IDX_YEAR
CREATE INDEX idx_year
ON FILM (release_year);

-- IDX_RATE
CREATE INDEX idx_rate
ON FILM (rating);

-- IDX_FEATURE
CREATE INDEX idx_feature
ON FILM (special_features);

-- Perfoamnce afrer creating index
EXPLAIN ANALYZE
SELECT SUM(group_count) AS total
FROM (
    SELECT COUNT(*) AS group_count
    FROM FILM
    GROUP BY release_year, rating, special_features
)
WHERE group_count > 40;

-- (B) without GROUP BY clause
EXPLAIN ANALYZE
SELECT COUNT(*) AS total
FROM FILM F1
WHERE (
    SELECT COUNT(*)
    FROM FILM F2
    WHERE F1.release_year = F2.release_year
        AND F1.rating = F2.rating
        AND F1.special_features = F2.special_features
) > 40;


