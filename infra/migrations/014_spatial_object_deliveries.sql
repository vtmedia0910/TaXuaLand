-- Transport receipts preserve existing published release/asset metadata verbatim.
CREATE TABLE spatial_object_deliveries (
  release_id uuid NOT NULL REFERENCES dataset_releases(id),
  public_base_url text NOT NULL CHECK(public_base_url ~ '^https://[^/?#@]+$'),
  driver text NOT NULL CHECK(driver='s3'),
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(release_id,public_base_url)
);
CREATE TRIGGER spatial_delivery_immutable BEFORE UPDATE OR DELETE ON spatial_object_deliveries FOR EACH ROW EXECUTE FUNCTION protect_audit_history();
CREATE FUNCTION protect_delivered_spatial_metadata() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME='dataset_releases' THEN
    IF EXISTS(SELECT 1 FROM spatial_object_deliveries WHERE release_id=OLD.id) AND
       (TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['qa_status','published_at']) IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['qa_status','published_at'])) THEN
      RAISE EXCEPTION 'Delivered spatial metadata is immutable';
    END IF;
  ELSE
    IF (TG_OP<>'INSERT' AND OLD.zone='published' AND EXISTS(SELECT 1 FROM spatial_object_deliveries WHERE release_id=OLD.release_id)) OR
       (TG_OP<>'DELETE' AND NEW.zone='published' AND EXISTS(SELECT 1 FROM spatial_object_deliveries WHERE release_id=NEW.release_id)) THEN
      RAISE EXCEPTION 'Delivered spatial assets are immutable';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER delivered_release_immutable BEFORE UPDATE OR DELETE ON dataset_releases FOR EACH ROW EXECUTE FUNCTION protect_delivered_spatial_metadata();
CREATE TRIGGER delivered_assets_immutable BEFORE INSERT OR UPDATE OR DELETE ON dataset_assets FOR EACH ROW EXECUTE FUNCTION protect_delivered_spatial_metadata();
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='land_app') THEN
    GRANT SELECT ON spatial_object_deliveries TO land_app;
  END IF;
END $$;
