"""Build the approved bounded Sentinel-2 Slice 1C imagery candidate."""
from __future__ import annotations

import ctypes
import hashlib
import json
import math
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pyproj
import rasterio
from rasterio.features import geometry_mask
from rasterio.mask import mask
from rasterio.transform import from_bounds, from_origin
from rasterio.warp import Resampling, reproject, transform_geom
from shapely.geometry import Polygon, box, mapping, shape

ROOT = Path(__file__).resolve().parent.parent
LOCK_PATH = ROOT / "pipelines" / "imagery.lock.json"
RELEASE = "TX-IMAGERY-S2L2A-20260527T034216Z-001"
RAW = ROOT / "work" / "gis" / "raw" / "S2C_T48QVJ_20260527T033930_L2A"
BUILD = ROOT / "work" / "gis" / RELEASE
OBSTRUCTION_CLASSES = (3, 8, 9, 10, 11)
WEB_MERCATOR_LIMIT = 20037508.342789244


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def canonical(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".partial")
    temporary.write_text(json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
    temporary.replace(path)


def assert_source(lock: dict) -> tuple[Path, Path]:
    item = json.loads((RAW / "item.json").read_text(encoding="utf-8"))
    if item["id"] != lock["itemId"] or item["collection"] != lock["collection"] or item["properties"]["s2:product_uri"] != lock["productId"]:
        raise RuntimeError("Exact Sentinel Item identity changed")
    if item["properties"]["datetime"] != lock["sensingAt"] or item["properties"]["proj:epsg"] != int(lock["sourceCrs"].removeprefix("EPSG:")):
        raise RuntimeError("Sentinel sensing identity or CRS changed")
    if item["properties"]["eo:cloud_cover"] > 20 or item["properties"]["eo:cloud_cover"] != lock["sceneCloudPercent"]:
        raise RuntimeError("Sentinel scene cloud gate failed")
    canonical_geojson = lock["aoi"]["canonicalGeoJson"]
    if hashlib.sha256(canonical_geojson.encode("utf-8")).hexdigest() != lock["aoi"]["sha256"]:
        raise RuntimeError("Authoritative LAND AOI hash mismatch")
    aoi = shape(json.loads(canonical_geojson))
    if list(aoi.bounds) != lock["aoi"]["bbox"] or lock["aoi"]["srid"] != 4326:
        raise RuntimeError("Authoritative LAND AOI geometry mismatch")
    if not Polygon(lock["itemGeometry"]).covers(aoi) or not shape(item["geometry"]).covers(aoi):
        raise RuntimeError("Sentinel Item does not fully contain LAND AOI")
    for name, asset in lock["assets"].items():
        path = RAW / asset["filename"]
        if not path.is_file() or path.stat().st_size != asset["bytes"] or sha256(path) != asset["sha256"]:
            raise RuntimeError(f"Sentinel source checksum mismatch: {name}")
    return RAW / lock["assets"]["visual"]["filename"], RAW / lock["assets"]["scl"]["filename"]


def assert_raster(dataset: rasterio.DatasetReader, asset: dict, bands: int) -> None:
    if dataset.crs is None or dataset.crs.to_epsg() != 32648 or dataset.count != bands or dataset.dtypes[0] != "uint8":
        raise RuntimeError("Unsupported Sentinel raster CRS/bands/type")
    if [dataset.height, dataset.width] != asset["shape"] or not np.allclose(tuple(dataset.transform)[:6], asset["transform"], atol=0, rtol=0):
        raise RuntimeError("Sentinel raster dimensions or transform changed")
    if tuple(round(value, 9) for value in dataset.res) != (asset["gsd"], asset["gsd"]):
        raise RuntimeError("Sentinel raster resolution changed")


def write_tiff(path: Path, data: np.ndarray, source: rasterio.DatasetReader, transform, crs=None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    profile = source.profile.copy()
    profile.update(driver="GTiff", height=data.shape[1], width=data.shape[2], count=data.shape[0], transform=transform, crs=crs or source.crs, nodata=0, compress="DEFLATE", predictor=2, tiled=True, blockxsize=256, blockysize=256)
    with rasterio.open(path, "w", **profile) as target:
        target.write(data)


def tile_range(bbox: list[float], level: int) -> tuple[range, range]:
    n = 2**level
    x = lambda lon: (lon + 180) / 360 * n
    y = lambda lat: (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return range(max(0, math.floor(x(bbox[0]))), min(n - 1, math.ceil(x(bbox[2])) - 1) + 1), range(max(0, math.floor(y(bbox[3]))), min(n - 1, math.ceil(y(bbox[1])) - 1) + 1)


def tile_bounds(level: int, x: int, y: int) -> tuple[float, float, float, float]:
    span = 2 * WEB_MERCATOR_LIMIT / 2**level
    left, top = -WEB_MERCATOR_LIMIT + x * span, WEB_MERCATOR_LIMIT - y * span
    return left, top - span, left + span, top


def libpng_version() -> str:
    candidates = list((Path(sys.prefix) / "Lib" / "site-packages" / "rasterio.libs").glob("libpng*.dll"))
    if not candidates:
        return "GDAL PNG driver"
    function = ctypes.CDLL(str(candidates[0])).png_get_libpng_ver
    function.restype = ctypes.c_char_p
    return function(None).decode("ascii")


def main() -> None:
    lock_bytes = LOCK_PATH.read_bytes()
    lock = json.loads(lock_bytes)
    visual_path, scl_path = assert_source(lock)
    acquisition = json.loads((RAW / "acquisition.json").read_text(encoding="utf-8"))
    if acquisition["itemId"] != lock["itemId"]:
        raise RuntimeError("Imagery acquisition record mismatch")
    aoi_4326 = mapping(shape(json.loads(lock["aoi"]["canonicalGeoJson"])))
    aoi_32648 = transform_geom("EPSG:4326", "EPSG:32648", aoi_4326, precision=9)
    aoi_3857 = transform_geom("EPSG:4326", "EPSG:3857", aoi_4326, precision=9)
    (BUILD / "raw").mkdir(parents=True, exist_ok=True)
    shutil.copyfile(LOCK_PATH, BUILD / "raw" / "source-lock.json")
    shutil.copyfile(RAW / "acquisition.json", BUILD / "raw" / "acquisition.json")

    with rasterio.open(visual_path) as visual, rasterio.open(scl_path) as scl:
        assert_raster(visual, lock["assets"]["visual"], 3)
        assert_raster(scl, lock["assets"]["scl"], 1)
        if visual.width != scl.width * 2 or visual.height != scl.height * 2:
            raise RuntimeError("Sentinel visual/SCL dimensions are inconsistent")
        if not box(*visual.bounds).covers(shape(aoi_32648)) or not box(*scl.bounds).covers(shape(aoi_32648)):
            raise RuntimeError("Sentinel source rasters do not contain LAND AOI")

        scl_masked, scl_transform = mask(scl, [aoi_32648], crop=True, filled=True, nodata=0, all_touched=False)
        values = scl_masked[0]
        inside = geometry_mask([aoi_32648], out_shape=values.shape, transform=scl_transform, invert=True, all_touched=False)
        total = int(np.count_nonzero(inside))
        nodata = int(np.count_nonzero(inside & (values == 0)))
        saturated = int(np.count_nonzero(inside & (values == 1)))
        class_counts = {str(value): int(np.count_nonzero(inside & (values == value))) for value in OBSTRUCTION_CLASSES}
        obstructed = sum(class_counts.values())
        obstruction = obstructed / total * 100 if total else math.inf
        if total == 0 or nodata or saturated or obstruction > 10:
            raise RuntimeError("Sentinel AOI SCL acceptance gate failed")

        visual_masked, visual_transform = mask(visual, [aoi_32648], crop=True, filled=True, nodata=0, all_touched=False)
        write_tiff(BUILD / "normalized" / "visual-aoi.tif", visual_masked, visual, visual_transform)
        write_tiff(BUILD / "normalized" / "scl-aoi.tif", scl_masked, scl, scl_transform)

        qa = {
            "schema": "LAND_IMAGERY_QA_V1",
            "itemId": lock["itemId"],
            "aoiId": lock["aoi"]["id"],
            "aoiVersion": lock["aoi"]["version"],
            "aoiSha256": lock["aoi"]["sha256"],
            "aoiContained": True,
            "sceneCloudPercent": lock["sceneCloudPercent"],
            "obstructionThresholdPercent": 10,
            "obstructionClasses": list(OBSTRUCTION_CLASSES),
            "classPixelCounts": class_counts,
            "aoiPixelCount": total,
            "validPixelCount": total - nodata - saturated,
            "obstructedPixelCount": obstructed,
            "aoiObstructionPercent": obstruction,
            "nodataPixelCount": nodata,
            "saturatedPixelCount": saturated,
            "verificationStatus": "UNKNOWN",
            "accuracy": "UNKNOWN",
        }
        canonical(BUILD / "derived" / "qa.json", qa)

        left, bottom, right, top = shape(aoi_3857).bounds
        width, height = math.ceil((right - left) / 10), math.ceil((top - bottom) / 10)
        web_transform = from_origin(left, top, 10, 10)
        web_rgb = np.zeros((3, height, width), dtype=np.uint8)
        for band in range(3):
            reproject(source=visual_masked[band], destination=web_rgb[band], src_transform=visual_transform, src_crs=visual.crs, dst_transform=web_transform, dst_crs="EPSG:3857", src_nodata=0, dst_nodata=0, resampling=Resampling.bilinear, num_threads=1)
        web_alpha = geometry_mask([aoi_3857], out_shape=(height, width), transform=web_transform, invert=True, all_touched=True).astype(np.uint8) * 255
        web_path = BUILD / "derived" / "visual-aoi-3857.tif"
        write_tiff(web_path, np.concatenate((web_rgb, web_alpha[np.newaxis, :, :]), axis=0), visual, web_transform, "EPSG:3857")

        tiles: dict[str, dict] = {}
        published = BUILD / "published"
        with rasterio.open(web_path) as web_visual:
            for level in range(15):
                xs, ys = tile_range(lock["aoi"]["bbox"], level)
                for x in xs:
                    for y in ys:
                        bounds = tile_bounds(level, x, y)
                        transform = from_bounds(*bounds, 256, 256)
                        rgba = np.zeros((4, 256, 256), dtype=np.uint8)
                        for band in range(1, 5):
                            reproject(source=rasterio.band(web_visual, band), destination=rgba[band - 1], src_transform=web_visual.transform, src_crs=web_visual.crs, dst_transform=transform, dst_crs="EPSG:3857", src_nodata=0, dst_nodata=0, resampling=Resampling.bilinear if band < 4 else Resampling.nearest, num_threads=1)
                        relative = f"{level}/{x}/{y}.png"
                        target = published / relative
                        target.parent.mkdir(parents=True, exist_ok=True)
                        with rasterio.Env(GDAL_PAM_ENABLED="NO"):
                            with rasterio.open(target, "w", driver="PNG", width=256, height=256, count=4, dtype="uint8", ZLEVEL=9) as png:
                                png.write(rgba)
                        with rasterio.open(target) as check:
                            if check.width != 256 or check.height != 256 or check.count != 4 or check.dtypes[0] != "uint8":
                                raise RuntimeError("Generated imagery tile is invalid")
                        tiles[relative] = {"bytes": target.stat().st_size, "sha256": sha256(target), "mediaType": "image/png"}

    tools = {"rasterio": rasterio.__version__, "gdal": rasterio.__gdal_version__, "proj": pyproj.proj_version_str, "libpng": libpng_version()}
    manifest_path = BUILD / "published" / "manifest.json"
    processed_at = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    if manifest_path.exists():
        processed_at = json.loads(manifest_path.read_text(encoding="utf-8"))["processing"]["processedAt"]
    manifest = {
        "format": "LAND_IMAGERY_V1",
        "datasetCode": "TX_IMAGERY_BASE",
        "releaseVersion": RELEASE,
        "source": {
            "name": lock["sourceName"], "collection": lock["collection"], "itemId": lock["itemId"], "productId": lock["productId"],
            "sourceLockSha256": hashlib.sha256(lock_bytes).hexdigest(),
            "assets": {name: {"sha256": asset["sha256"], "bytes": asset["bytes"], "mediaType": asset["mediaType"]} for name, asset in lock["assets"].items()},
            "sensingAt": lock["sensingAt"], "generatedAt": lock["generatedAt"], "acquiredAt": acquisition["acquiredAt"],
        },
        "processing": {"version": "land-imagery-1.0.0", "processedAt": processed_at, "tools": tools},
        "sourceCrs": "EPSG:32648", "targetCrs": "EPSG:3857", "aoi": lock["aoi"], "bbox": lock["aoi"]["bbox"],
        "nativeResolutionMeters": {"visual": 10, "sclQa": 20},
        "delivery": {"scheme": "WEB_MERCATOR_XYZ", "tileSize": 256, "minimumLevel": 0, "maximumLevel": 14, "resolutionAtMaximumLevelMeters": 156543.03392804097 / 2**14, "tileUrlTemplate": "{z}/{x}/{y}.png"},
        "quality": {key: qa[key] for key in ("sceneCloudPercent", "obstructionThresholdPercent", "aoiObstructionPercent", "obstructionClasses", "validPixelCount", "obstructedPixelCount", "nodataPixelCount", "saturatedPixelCount", "aoiContained")},
        "rights": lock["rights"], "verificationStatus": "UNKNOWN", "accuracy": "UNKNOWN",
        "limitations": ["Resolution is not positional accuracy.", "Cloud screening is not field verification.", "Acquisition time does not establish current conditions."],
        "tileCount": len(tiles), "tiles": dict(sorted(tiles.items())),
    }
    canonical(manifest_path, manifest)
    if manifest_path.stat().st_size > 1024 * 1024:
        raise RuntimeError("Imagery manifest exceeds 1 MiB")

    files = []
    for zone, root, names in (
        ("raw", RAW, ["item.json", "TCI.tif", "SCL.tif"]),
        ("raw", BUILD / "raw", ["source-lock.json", "acquisition.json"]),
        ("normalized", BUILD / "normalized", ["visual-aoi.tif", "scl-aoi.tif"]),
        ("derived", BUILD / "derived", ["visual-aoi-3857.tif", "qa.json"]),
        ("published", BUILD / "published", ["manifest.json", *sorted(tiles)]),
    ):
        for name in names:
            path = root / name
            files.append({"zone": zone, "file": name, "bytes": path.stat().st_size, "sha256": sha256(path)})
    canonical(BUILD / "build.json", {"schema": "LAND_IMAGERY_BUILD_V1", "releaseVersion": RELEASE, "sourceLockSha256": hashlib.sha256(lock_bytes).hexdigest(), "manifestSha256": sha256(manifest_path), "qa": qa, "files": files})
    print(json.dumps({"release": RELEASE, "sceneCloudPercent": qa["sceneCloudPercent"], "aoiObstructionPercent": qa["aoiObstructionPercent"], "tileCount": len(tiles), "manifestSha256": sha256(manifest_path), "tools": tools}, indent=2))


if __name__ == "__main__":
    main()
