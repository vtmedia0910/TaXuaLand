-- Runtime can stabilize the operational boundary during validation without
-- acquiring permission to edit the boundary or its provenance.
CREATE FUNCTION public.lock_import_aoi() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  PERFORM id FROM public.areas_of_interest WHERE active FOR SHARE;
END $$;
REVOKE ALL ON FUNCTION public.lock_import_aoi() FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='land_app') THEN
    GRANT EXECUTE ON FUNCTION public.lock_import_aoi() TO land_app;
  END IF;
END $$;
