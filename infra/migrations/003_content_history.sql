CREATE TABLE place_content_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), place_id uuid NOT NULL REFERENCES places(id),
  version integer NOT NULL, snapshot jsonb NOT NULL, actor_id uuid NOT NULL REFERENCES admin_users(id),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(place_id,version)
);
CREATE TRIGGER content_history_immutable BEFORE UPDATE OR DELETE ON place_content_revisions FOR EACH ROW EXECUTE FUNCTION protect_audit_history();
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='land_app') THEN
    GRANT SELECT,INSERT ON place_content_revisions TO land_app;
  END IF;
END $$;
