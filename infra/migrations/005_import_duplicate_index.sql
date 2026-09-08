CREATE INDEX place_geometries_geography_gist ON place_geometries USING gist((geometry::geography));
