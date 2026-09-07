-- ST_DWithin geography queries use metres and this index, never angular distance.
CREATE INDEX road_segments_geography_gist ON road_segments USING gist((geometry::geography));
