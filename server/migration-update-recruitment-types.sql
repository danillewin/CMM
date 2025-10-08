-- Safe migration to update recruitment field types
-- From: text/integer to text[]/boolean
BEGIN;

-- 1) integer → text (simple cast)
ALTER TABLE researches
  ALTER COLUMN recruitment_quantity TYPE text USING recruitment_quantity::text;

-- 2) text → text[] (segments)
ALTER TABLE researches ADD COLUMN IF NOT EXISTS recruitment_segments_new text[];
UPDATE researches
SET recruitment_segments_new = CASE
  WHEN recruitment_segments IS NULL OR btrim(recruitment_segments) = '' THEN NULL
  WHEN recruitment_segments ~ '[,;|]' THEN regexp_split_to_array(recruitment_segments, E'\\s*[,;|]\\s*')
  ELSE ARRAY[trim(recruitment_segments)]
END;
ALTER TABLE researches DROP COLUMN recruitment_segments;
ALTER TABLE researches RENAME COLUMN recruitment_segments_new TO recruitment_segments;

-- 3) text → text[] (used channels)
ALTER TABLE researches ADD COLUMN IF NOT EXISTS recruitment_used_channels_new text[];
UPDATE researches
SET recruitment_used_channels_new = CASE
  WHEN recruitment_used_channels IS NULL OR btrim(recruitment_used_channels) = '' THEN NULL
  WHEN recruitment_used_channels ~ '[,;|]' THEN regexp_split_to_array(recruitment_used_channels, E'\\s*[,;|]\\s*')
  ELSE ARRAY[trim(recruitment_used_channels)]
END;
ALTER TABLE researches DROP COLUMN recruitment_used_channels;
ALTER TABLE researches RENAME COLUMN recruitment_used_channels_new TO recruitment_used_channels;

-- 4) text → text[] (legal entity type)
ALTER TABLE researches ADD COLUMN IF NOT EXISTS recruitment_legal_entity_type_new text[];
UPDATE researches
SET recruitment_legal_entity_type_new = CASE
  WHEN recruitment_legal_entity_type IS NULL OR btrim(recruitment_legal_entity_type) = '' THEN NULL
  WHEN recruitment_legal_entity_type ~ '[,;|]' THEN regexp_split_to_array(recruitment_legal_entity_type, E'\\s*[,;|]\\s*')
  ELSE ARRAY[trim(recruitment_legal_entity_type)]
END;
ALTER TABLE researches DROP COLUMN recruitment_legal_entity_type;
ALTER TABLE researches RENAME COLUMN recruitment_legal_entity_type_new TO recruitment_legal_entity_type;

-- 5) text → boolean (restrictions)
ALTER TABLE researches ADD COLUMN IF NOT EXISTS recruitment_restrictions_bool boolean;
UPDATE researches
SET recruitment_restrictions_bool = CASE
  WHEN recruitment_restrictions IS NULL OR btrim(recruitment_restrictions) = '' THEN NULL
  WHEN lower(recruitment_restrictions) IN ('yes','true','да','y','1','t') THEN true
  WHEN lower(recruitment_restrictions) IN ('no','false','нет','n','0','f') THEN false
  ELSE NULL
END;
ALTER TABLE researches DROP COLUMN recruitment_restrictions;
ALTER TABLE researches RENAME COLUMN recruitment_restrictions_bool TO recruitment_restrictions;

COMMIT;