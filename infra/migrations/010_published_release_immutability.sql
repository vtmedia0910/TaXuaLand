CREATE FUNCTION protect_published_release() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.published_at IS NOT NULL THEN
    IF TG_OP='DELETE' OR (to_jsonb(NEW)-'qa_status') IS DISTINCT FROM (to_jsonb(OLD)-'qa_status') THEN
      RAISE EXCEPTION 'Published release metadata is immutable';
    END IF;
    IF NEW.qa_status NOT IN ('PUBLISHED','RETIRED') THEN RAISE EXCEPTION 'Published release can only be retired'; END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER published_release_immutable BEFORE UPDATE OR DELETE ON dataset_releases FOR EACH ROW EXECUTE FUNCTION protect_published_release();
CREATE FUNCTION protect_published_asset() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE subject uuid;
BEGIN
  subject := CASE WHEN TG_OP='INSERT' THEN NEW.release_id ELSE OLD.release_id END;
  IF EXISTS(SELECT 1 FROM dataset_releases WHERE id=subject AND published_at IS NOT NULL)
    AND (TG_OP<>'INSERT' OR NEW.zone='published') THEN
    RAISE EXCEPTION 'Published assets are immutable';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER published_asset_immutable BEFORE INSERT OR UPDATE OR DELETE ON dataset_assets FOR EACH ROW EXECUTE FUNCTION protect_published_asset();
