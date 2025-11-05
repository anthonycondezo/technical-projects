--EXPLAIN ANALYZE
SELECT SUM(group_count) AS total
FROM (
    SELECT COUNT(*) AS group_count
    FROM FILM
    GROUP BY release_year, rating, special_features
)
WHERE group_count > 40;

-- (B) without GROUP BY clause
--EXPLAIN ANALYZE
SELECT COUNT(*) AS total
FROM FILM F1 
WHERE (
    SELECT COUNT(*)
    FROM FILM F2
    WHERE F1.release_year = F2.release_year 
        AND F1.rating = F2.rating
        AND F1.special_features = F2.special_features
) > 40;
