CREATE FUNCTION protect_import_row_origin() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.batch_id IS DISTINCT FROM OLD.batch_id OR NEW.row_number IS DISTINCT FROM OLD.row_number
     OR NEW.raw_data_json IS DISTINCT FROM OLD.raw_data_json OR NEW.raw_payload_hash IS DISTINCT FROM OLD.raw_payload_hash THEN
    RAISE EXCEPTION 'Import row origin is immutable';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER import_row_origin_immutable BEFORE UPDATE ON import_rows FOR EACH ROW EXECUTE FUNCTION protect_import_row_origin();
CREATE FUNCTION protect_import_source_record() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.import_row_id IS NOT NULL AND (TG_OP='DELETE' OR (to_jsonb(NEW)-'archived_at') IS DISTINCT FROM (to_jsonb(OLD)-'archived_at')) THEN
    RAISE EXCEPTION 'Imported source provenance is immutable';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER imported_source_immutable BEFORE UPDATE OR DELETE ON source_records FOR EACH ROW EXECUTE FUNCTION protect_import_source_record();
