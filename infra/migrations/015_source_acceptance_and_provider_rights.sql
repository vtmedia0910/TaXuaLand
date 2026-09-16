CREATE TYPE source_acceptance AS ENUM ('OWNER_APPROVED','SOURCE_APPROVED','REJECTED');
CREATE TYPE provider_rights_status AS ENUM ('ALLOWED','RESTRICTED','REVIEW_REQUIRED','UNKNOWN');

ALTER TABLE sources
  ADD COLUMN source_acceptance source_acceptance,
  ADD COLUMN provider_rights_status provider_rights_status NOT NULL DEFAULT 'UNKNOWN';
