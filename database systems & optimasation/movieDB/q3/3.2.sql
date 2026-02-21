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


