-- create virtual view
-- list actor_id, first_name, last_name
-- rental_rate > 4, 'Music' category, released in 2010

CREATE MATERIALIZED VIEW MV_HR_MU_2010_ACTORS AS
SELECT DISTINCT A.actor_id, A.first_name, A.last_name
FROM ACTOR A
JOIN FILM_ACTOR FA ON A.actor_id = FA.actor_id
JOIN FILM F ON FA.film_id = F.film_id AND F.rental_rate > 4 AND F.release_year = 2010
JOIN FILM_CATEGORY FG ON F.film_id = FG.film_id
JOIN CATEGORY C ON FG.category_id = C.category_id AND C.name = 'Music'
ORDER BY A.actor_id;
