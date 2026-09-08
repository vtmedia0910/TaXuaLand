ALTER TABLE import_rows ADD COLUMN target_place_version integer CHECK(target_place_version>0);
CREATE TABLE import_row_revisions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),import_row_id uuid NOT NULL REFERENCES import_rows(id),actor_id uuid NOT NULL REFERENCES admin_users(id),snapshot jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
CREATE TRIGGER import_row_revision_immutable BEFORE UPDATE OR DELETE ON import_row_revisions FOR EACH ROW EXECUTE FUNCTION protect_audit_history();
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='land_app') THEN GRANT SELECT,INSERT ON import_row_revisions TO land_app; END IF; END $$;
