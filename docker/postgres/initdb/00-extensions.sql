-- pg_trgm backs the ilike '%..%' student / receipt / payment searches.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;
