CREATE INDEX idx_boat 
ON FILM (POSITION('Boat' IN description), title);

