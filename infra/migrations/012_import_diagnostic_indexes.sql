CREATE INDEX import_batches_uploaded_at_idx ON import_batches(uploaded_at DESC);
CREATE INDEX import_batches_user_uploaded_idx ON import_batches(uploaded_by,uploaded_at DESC);
CREATE INDEX import_row_errors_row_idx ON import_row_errors(import_row_id);
