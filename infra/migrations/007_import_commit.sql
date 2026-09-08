ALTER TABLE import_rows ADD COLUMN replacement_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE source_records ADD COLUMN import_row_id uuid UNIQUE REFERENCES import_rows(id);
ALTER TABLE import_batches ADD COLUMN commit_result jsonb;
ALTER TABLE import_batches ADD CONSTRAINT committed_result_required CHECK(status<>'COMMITTED' OR (commit_result IS NOT NULL AND committed_at IS NOT NULL));

CREATE FUNCTION protect_committed_import() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.committed_at IS NOT NULL THEN
    IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Committed import is immutable'; END IF;
    IF TG_TABLE_NAME='import_rows' OR (to_jsonb(NEW)-'storage_key') IS DISTINCT FROM (to_jsonb(OLD)-'storage_key') THEN
      RAISE EXCEPTION 'Committed import is immutable';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER committed_batch_immutable BEFORE UPDATE OR DELETE ON import_batches FOR EACH ROW EXECUTE FUNCTION protect_committed_import();
CREATE TRIGGER committed_row_immutable BEFORE UPDATE OR DELETE ON import_rows FOR EACH ROW EXECUTE FUNCTION protect_committed_import();
CREATE TRIGGER import_action_immutable BEFORE UPDATE OR DELETE ON import_row_actions FOR EACH ROW EXECUTE FUNCTION protect_audit_history();
