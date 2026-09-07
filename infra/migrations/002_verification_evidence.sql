-- SQL CHECK constraints must reject NULL evidence explicitly. Verification is
-- independent for geometry, access descriptions and safety notes.
DO $$ DECLARE constraint_row record; BEGIN
  FOR constraint_row IN SELECT conname FROM pg_constraint WHERE conrelid='place_geometries'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%verification_method%'
  LOOP EXECUTE format('ALTER TABLE place_geometries DROP CONSTRAINT %I',constraint_row.conname); END LOOP;
END $$;
ALTER TABLE place_geometries ADD CONSTRAINT geometry_verified_evidence CHECK(
  verification_status <> 'VERIFIED' OR
  (verified_at IS NOT NULL AND verified_by IS NOT NULL AND verification_method IS NOT NULL
   AND length(trim(verification_method)) > 0 AND evidence_source_record_id IS NOT NULL AND freshness_policy <> 'UNKNOWN')
);
ALTER TABLE place_access_contexts DROP CONSTRAINT place_access_contexts_verification_status_check;
ALTER TABLE place_safety_notes DROP CONSTRAINT place_safety_notes_verification_status_check;
ALTER TABLE place_access_contexts ADD COLUMN verified_at timestamptz, ADD COLUMN verified_by uuid REFERENCES admin_users(id), ADD COLUMN verification_method text, ADD COLUMN evidence_source_record_id uuid REFERENCES source_records(id), ADD COLUMN freshness_policy text NOT NULL DEFAULT 'UNKNOWN' CHECK(freshness_policy IN ('UNKNOWN','NO_EXPIRY','EXPIRES')), ADD COLUMN expires_at timestamptz;
ALTER TABLE place_safety_notes ADD COLUMN verified_at timestamptz, ADD COLUMN verified_by uuid REFERENCES admin_users(id), ADD COLUMN verification_method text, ADD COLUMN evidence_source_record_id uuid REFERENCES source_records(id), ADD COLUMN freshness_policy text NOT NULL DEFAULT 'UNKNOWN' CHECK(freshness_policy IN ('UNKNOWN','NO_EXPIRY','EXPIRES'));
ALTER TABLE place_access_contexts ADD CONSTRAINT access_verified_evidence CHECK(verification_status <> 'VERIFIED' OR (verified_at IS NOT NULL AND verified_by IS NOT NULL AND verification_method IS NOT NULL AND length(trim(verification_method)) > 0 AND evidence_source_record_id IS NOT NULL AND freshness_policy <> 'UNKNOWN')), ADD CONSTRAINT access_expiry CHECK(freshness_policy <> 'EXPIRES' OR expires_at IS NOT NULL);
ALTER TABLE place_safety_notes ADD CONSTRAINT safety_verified_evidence CHECK(verification_status <> 'VERIFIED' OR (verified_at IS NOT NULL AND verified_by IS NOT NULL AND verification_method IS NOT NULL AND length(trim(verification_method)) > 0 AND evidence_source_record_id IS NOT NULL AND freshness_policy <> 'UNKNOWN')), ADD CONSTRAINT safety_expiry CHECK(freshness_policy <> 'EXPIRES' OR expires_at IS NOT NULL);
