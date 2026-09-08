"""Reproducible bounded DEM release: WGS84/EGM2008 -> UTM48N/ellipsoid -> Cesium tiles."""
import hashlib
import json
import sys
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling, transform_bounds
from rasterio.transform import from_origin
from pyproj import Transformer, Geod
from common import ROOT, RAW, sha256

VERSION = "TX-DEM-2026-001"
PIPELINE_VERSION = "land-dem-1.0.0"
BBOX = [104.30, 21.05, 104.80, 21.55]
SIZE, MAX_LEVEL, METRIC_RESOLUTION = 65, 4, 60
ATTRIBUTION = "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved"
LICENSE_URL = "https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf"

def bilinear(array, transform, lon, lat):
    col, row = ~transform * (lon, lat)
    col, row = np.asarray(col) - 0.5, np.asarray(row) - 0.5
    x, y = np.floor(col).astype(int), np.floor(row).astype(int)
    if np.any(x < 0) or np.any(y < 0) or np.any(x + 1 >= array.shape[1]) or np.any(y + 1 >= array.shape[0]):
        raise ValueError("Requested samples exceed measured raster coverage")
    dx, dy = col - x, row - y
    return array[y, x] * (1-dx)*(1-dy) + array[y, x+1]*dx*(1-dy) + array[y+1, x]*(1-dx)*dy + array[y+1, x+1]*dx*dy

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

def build():
    lock = json.loads((ROOT / "pipelines/sources.lock.json").read_text())
    paths = {key: RAW / lock[key]["filename"] for key in ("dem", "geoid")}
    for key, path in paths.items():
        if sha256(path) != lock[key]["sha256"]:
            raise ValueError(f"Raw checksum mismatch: {key}")
    release = ROOT / "work/gis" / VERSION
    if release.exists():
        raise ValueError("Release exists. Verify it or use a new version; never overwrite published bytes.")
    normalized = release / "normalized"
    derived = release / "derived"
    published = release / "published"
    for directory in (normalized, derived, published):
        directory.mkdir(parents=True)
    west, south, east, north = BBOX
    to_metric = Transformer.from_crs("EPSG:4326", "EPSG:32648", always_xy=True)
    to_geo = Transformer.from_crs("EPSG:32648", "EPSG:4326", always_xy=True)
    vertical = Transformer.from_pipeline(f"+proj=pipeline +step +proj=unitconvert +xy_in=deg +xy_out=rad +step +proj=vgridshift +grids={paths['geoid'].as_posix()} +multiplier=1 +step +proj=unitconvert +xy_in=rad +xy_out=deg")
    left, bottom, right, top = transform_bounds("EPSG:4326", "EPSG:32648", *BBOX, densify_pts=41)
    padding = 5 * METRIC_RESOLUTION
    left, top = np.floor((left-padding)/60)*60, np.ceil((top+padding)/60)*60
    width, height = int(np.ceil((right+padding-left)/60)), int(np.ceil((top-bottom+padding)/60))
    transform = from_origin(left, top, 60, 60)
    orthometric = np.full((height, width), np.nan, dtype="float32")
    with rasterio.open(paths["dem"]) as source:
        if source.crs.to_epsg() != 4326 or source.count != 1:
            raise ValueError("Unexpected DEM horizontal CRS/bands")
        reproject(source=rasterio.band(source, 1), destination=orthometric, src_transform=source.transform, src_crs=source.crs, src_nodata=source.nodata, dst_transform=transform, dst_crs="EPSG:32648", dst_nodata=np.nan, resampling=Resampling.bilinear)
        raw_transform, raw_values = source.transform, source.read(1)
        source_metadata = {"crs": source.crs.to_string(), "pixelSpacingDegrees": list(source.res), "rasterType": source.tags().get("AREA_OR_POINT", "UNKNOWN"), "bounds": list(source.bounds)}
    rr, cc = np.indices(orthometric.shape)
    xx, yy = transform * (cc + 0.5, rr + 0.5)
    lon, lat = to_geo.transform(xx, yy)
    _, _, ellipsoid = vertical.transform(lon, lat, orthometric.astype("float64"), errcheck=True)
    if not np.isfinite(ellipsoid).all():
        raise ValueError("NoData in representative coverage; do not invent missing heights")
    _, _, restored = vertical.transform(lon, lat, ellipsoid, direction="INVERSE", errcheck=True)
    vertical_roundtrip = float(np.max(np.abs(restored-orthometric)))
    if vertical_roundtrip > 1e-6:
        raise ValueError("Vertical transformation round trip failed")
    for filename, values, datum in (("orthometric-utm48n.tif", orthometric, "EGM2008 (EPSG:3855)"), ("ellipsoid-utm48n.tif", ellipsoid, "WGS84 ellipsoid (EPSG:4979)")):
        with rasterio.open(normalized / filename, "w", driver="GTiff", height=height, width=width, count=1, dtype="float32", crs="EPSG:32648", transform=transform, compress="deflate", nodata=np.nan) as output:
            output.write(values.astype("float32"), 1)
            output.update_tags(vertical_datum=datum, processing_version=PIPELINE_VERSION, source_sha256=lock["dem"]["sha256"])
    count = (SIZE-1)*2**MAX_LEVEL+1
    longitudes, latitudes = np.meshgrid(np.linspace(west, east, count), np.linspace(north, south, count))
    metric_x, metric_y = to_metric.transform(longitudes, latitudes)
    master = bilinear(ellipsoid, transform, metric_x, metric_y).astype("<f4")
    np.save(derived / "height-grid.npy", master)
    tile_index = {}
    for level in range(MAX_LEVEL+1):
        tiles = 2**level
        step = 2**(MAX_LEVEL-level)
        level_grid = master[::step, ::step]
        for y in range(tiles):
            for x in range(tiles):
                key = f"{level}/{x}/{y}.bin"
                path = published / key
                path.parent.mkdir(parents=True, exist_ok=True)
                data = np.ascontiguousarray(level_grid[y*64:y*64+65, x*64:x*64+65], dtype="<f4").tobytes()
                path.write_bytes(data)
                tile_index[key] = {"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}
    # Check physical transformation independently against the geoid raster sampler.
    check_lon = np.array([104.35, 104.45, 104.53036202410956, 104.62, 104.75])
    check_lat = np.array([21.10, 21.20, 21.26254175667024, 21.35, 21.50])
    mx, my = to_metric.transform(check_lon, check_lat)
    rx, ry = to_geo.transform(mx, my)
    horizontal_error = float(np.max(Geod(ellps="WGS84").inv(check_lon, check_lat, rx, ry)[2]))
    with rasterio.open(paths["geoid"]) as grid:
        grid_correction = bilinear(grid.read(1), grid.transform, check_lon, check_lat)
    _, _, proj_correction = vertical.transform(check_lon, check_lat, np.zeros(5), errcheck=True)
    geoid_error = float(np.max(np.abs(proj_correction-grid_correction)))
    if geoid_error > 0.001 or horizontal_error > 0.001:
        raise ValueError("Independent CRS/grid comparison failed")
    sample_height = bilinear(ellipsoid, transform, mx, my)
    source_height = bilinear(raw_values, raw_transform, check_lon, check_lat)
    samples = [{"longitude": float(lo), "latitude": float(la), "sourceOrthometricMeters": float(H), "geoidUndulationMeters": float(N), "processedEllipsoidMeters": float(h), "resamplingDifferenceMeters": float(h-H-N), "verificationStatus": "UNKNOWN"} for lo, la, H, N, h in zip(check_lon, check_lat, source_height, proj_correction, sample_height)]
    # These are reproducibility checks, not survey/control-point accuracy claims.
    qa = {"horizontalRoundTripMaxMeters": horizontal_error, "verticalRoundTripMaxMeters": vertical_roundtrip, "geoidIndependentComparisonMaxMeters": geoid_error, "noDataCount": 0, "seamErrorMeters": 0, "samples": samples, "fieldControlPoints": "UNKNOWN", "absoluteLocalAccuracy": "UNKNOWN"}
    write_json(release / "qa.json", qa)
    manifest = {"format": "LAND_HEIGHTMAP_V1", "version": VERSION, "processingVersion": PIPELINE_VERSION, "bbox": BBOX, "tileSize": SIZE, "maximumLevel": MAX_LEVEL, "horizontalCrs": "EPSG:4326", "sourceVerticalDatum": "EGM2008 (EPSG:3855)", "verticalDatum": "WGS84_ELLIPSOID", "normalizationCrs": "EPSG:32648", "resolutionMeters": 60, "heightRangeMeters": [float(master.min()), float(master.max())], "source": "Copernicus DEM GLO-30 Public / AWS COG N21 E104", "sourceVersion": lock["dem"]["sha256"], "geoidVersion": lock["geoid"]["sha256"], "license": LICENSE_URL, "attribution": ATTRIBUTION, "liabilityNotice": "The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30", "surfaceModel": "DSM: includes vegetation and structures; not bare earth", "verificationStatus": "UNKNOWN", "sourceMetadata": source_metadata, "tiles": tile_index}
    write_json(published / "manifest.json", manifest)
    write_json(release / "build.json", {"generatedAt": datetime.now(timezone.utc).isoformat(), "sourceLock": lock, "manifestSha256": sha256(published / "manifest.json"), "runtime": {"python": sys.version, "rasterio": rasterio.__version__, "numpy": np.__version__}, "qa": qa})
    print(json.dumps({"version": VERSION, "tiles": len(tile_index), "manifestSha256": sha256(published / "manifest.json"), "heightRangeMeters": manifest["heightRangeMeters"], "qa": qa}), flush=True)

if __name__ == "__main__":
    build()
