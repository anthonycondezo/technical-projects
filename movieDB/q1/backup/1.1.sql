-- Find all short (i.e. length < 50) English Comedy Films
-- 'English' is the language (not the original language)
-- 'Comedy' is film category
-- display file titles

-- draft - missing 'Comedy' filter
--SELECT F.title, L.name, C.category_id, F.length FROM FILM F
--JOIN LANGUAGE L ON L.language_id = F.language_id AND L.name = 'English'
--JOIN FILM_CATEGORY FC ON FC.film_id = F.film_id
--JOIN CATEGORY C ON C.category_id = FC.category_id
--WHERE F.length < 50;

-- view sub-query
SELECT F.title
FROM FILM F
JOIN LANGUAGE L ON L.language_id = F.language_id AND L.name = 'English'
JOIN FILM_CATEGORY FC ON FC.film_id = F.film_id
JOIN CATEGORY C ON C.category_id = FC.category_id AND C.name = 'Comedy'
WHERE F.length < 50;

-- TODO: check result
