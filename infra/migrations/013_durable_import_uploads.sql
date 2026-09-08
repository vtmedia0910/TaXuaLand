-- Operational transport metadata only; domain/review/commit enums and triggers stay unchanged.
ALTER TABLE import_batches ADD COLUMN validation_request jsonb;
CREATE TABLE import_uploads (
  batch_id uuid PRIMARY KEY REFERENCES import_batches(id),
  actor_id uuid NOT NULL REFERENCES admin_users(id),
  request_id uuid NOT NULL,
  driver text NOT NULL CHECK(driver IN ('local','s3')),
  raw_key text UNIQUE,
  inspection_key text NOT NULL UNIQUE,
  expected_size integer CHECK(expected_size BETWEEN 4 AND 8388608),
  expected_sha256 text CHECK(expected_sha256 ~ '^[a-f0-9]{64}$'),
  inspection_size integer CHECK(inspection_size BETWEEN 1 AND 33554432),
  inspection_sha256 text CHECK(inspection_sha256 ~ '^[a-f0-9]{64}$'),
  state text NOT NULL DEFAULT 'UPLOAD_PENDING' CHECK(state IN ('UPLOAD_PENDING','PROCESSING','UPLOADED','FAILED','EXPIRED')),
  upload_expires_at timestamptz NOT NULL,
  url_issues integer NOT NULL DEFAULT 0 CHECK(url_issues BETWEEN 0 AND 10),
  finalize_attempts integer NOT NULL DEFAULT 0 CHECK(finalize_attempts BETWEEN 0 AND 10),
  error_category text CHECK(error_category ~ '^[A-Z_]+$'),
  UNIQUE(actor_id,request_id),
  CHECK ((raw_key IS NULL AND expected_size IS NULL AND expected_sha256 IS NULL) OR
    (raw_key IS NOT NULL AND expected_size IS NOT NULL AND expected_sha256 IS NOT NULL)),
  CHECK (raw_key IS NULL OR raw_key ~ ('^imports/raw/' || batch_id::text || '/[0-9a-f-]{36}\.xlsx$')),
  CHECK (inspection_key ~ ('^imports/inspection/' || batch_id::text || '/[0-9a-f-]{36}\.json$')),
  CHECK (state <> 'UPLOADED' OR (inspection_size IS NOT NULL AND inspection_sha256 IS NOT NULL))
);
CREATE FUNCTION protect_import_upload_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Import transport identity is immutable'; END IF;
  IF (to_jsonb(NEW)-ARRAY['state','url_issues','finalize_attempts','error_category','inspection_size','inspection_sha256'])
     IS DISTINCT FROM
     (to_jsonb(OLD)-ARRAY['state','url_issues','finalize_attempts','error_category','inspection_size','inspection_sha256'])
     OR (OLD.inspection_sha256 IS NOT NULL AND (NEW.inspection_sha256 IS DISTINCT FROM OLD.inspection_sha256 OR NEW.inspection_size IS DISTINCT FROM OLD.inspection_size))
     OR (OLD.state='EXPIRED' AND NEW.state<>'EXPIRED')
     OR (OLD.state='UPLOADED' AND NEW.state NOT IN ('UPLOADED','EXPIRED')) THEN
    RAISE EXCEPTION 'Import transport identity is immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER import_upload_identity_immutable BEFORE UPDATE OR DELETE ON import_uploads FOR EACH ROW EXECUTE FUNCTION protect_import_upload_identity();
-- Existing deployments keep their least-privileged role. New/custom QA roles use the provisioning scripts.
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='land_app') THEN
    GRANT SELECT,INSERT,UPDATE ON import_uploads TO land_app;
  END IF;
END $$;
