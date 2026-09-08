ALTER TABLE dataset_releases ADD CONSTRAINT release_bbox_valid CHECK(bbox IS NULL OR (ST_IsValid(bbox) AND NOT ST_IsEmpty(bbox) AND ST_XMin(bbox)>=-180 AND ST_XMax(bbox)<=180 AND ST_YMin(bbox)>=-90 AND ST_YMax(bbox)<=90));
CREATE OR REPLACE FUNCTION protect_published_asset() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE subject uuid;
BEGIN
  subject := CASE WHEN TG_OP='INSERT' THEN NEW.release_id ELSE OLD.release_id END;
  IF EXISTS(SELECT 1 FROM dataset_releases WHERE id=subject AND published_at IS NOT NULL)
    AND (TG_OP<>'INSERT' OR NEW.zone='published') THEN RAISE EXCEPTION 'Published assets are immutable'; END IF;
  IF TG_OP='UPDATE' AND EXISTS(SELECT 1 FROM dataset_releases WHERE id=NEW.release_id AND published_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot move assets into a published release';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
