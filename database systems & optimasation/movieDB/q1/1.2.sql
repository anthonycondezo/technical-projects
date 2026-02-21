SELECT DISTINCT A.actor_id, A.first_name, A.last_name
FROM ACTOR A
JOIN FILM_ACTOR FA ON FA.actor_id = A.actor_id
JOIN FILM F1 ON F1.film_id = FA.film_id
WHERE F1.title IN (
    SELECT F.title
    FROM FILM F
    JOIN LANGUAGE L ON L.language_id = F.language_id AND L.name = 'English'
    JOIN FILM_CATEGORY FC ON FC.film_id = F.film_id
    JOIN CATEGORY C ON C.category_id = FC.category_id AND C.name = 'Comedy'
    WHERE F.length < 50    
);
