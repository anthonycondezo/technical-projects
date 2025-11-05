-- find first three films 
-- in ascending alphabetical order of titles
-- that take place on a 'Boat' in FILM.description 
SELECT title
FROM FILM
WHERE POSITION('Boat' IN description) > 0
ORDER BY title
LIMIT 10;
