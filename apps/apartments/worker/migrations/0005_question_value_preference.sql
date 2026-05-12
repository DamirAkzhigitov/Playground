-- For number/date questions: whether lower (cheaper / earlier) or higher (larger / later) values rank better in compare.
ALTER TABLE questions ADD COLUMN value_preference TEXT;
