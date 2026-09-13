"""Clip OSM ways to the operational AOI; export allowlisted road attributes only."""
import json
from shapely.geometry import LineString, box, mapping
from common import ROOT, RAW, sha256
from terrain import write_json

VERSION="TX-ROADS-2026-001"
AOI=[104.45,21.20,104.62,21.35]
AOI_EVIDENCE={"id":"1a169926-5c2c-48a7-a880-8e62b2b1d33d","version":"TX-AOI-2026-001","srid":4326,"bbox":AOI,"outsidePolicy":"WARNING","canonicalGeoJson":"{\"type\":\"Polygon\",\"coordinates\":[[[104.45,21.2],[104.45,21.35],[104.62,21.35],[104.62,21.2],[104.45,21.2]]]}","sha256":"11a166c87a6526b08cf7a1a480f3e5a0d394aec1be3f7336a7df437741417f14","authoritySemantics":"Owner-approved Phase 1 operational product coverage. NOT a legal or administrative boundary."}

def build():
    lock=json.loads((ROOT/"pipelines/roads.lock.json").read_text(encoding="utf8"))
    raw=RAW/lock["filename"]
    if sha256(raw)!=lock["sha256"]:
        raise ValueError("OSM checksum mismatch")
    extract=json.loads(raw.read_text(encoding="utf8"))
    release=ROOT/"work/gis"/VERSION
    if release.exists():
        raise ValueError("Immutable release already exists")
    features=[]
    for way in extract["elements"]:
        if way["type"]!="way":
            continue
        coordinates=[(p["lon"],p["lat"]) for p in way.get("geometry",[])]
        if len(coordinates)<2:
            raise ValueError("Incomplete road geometry")
        line=LineString(coordinates)
        if not line.is_valid:
            raise ValueError("Invalid source geometry; explicit repair review required")
        clipped=line.intersection(box(*AOI))
        parts=list(clipped.geoms) if hasattr(clipped,"geoms") else [clipped]
        for index,part in enumerate(parts):
            if part.is_empty or part.geom_type!="LineString":
                continue
            features.append({"type":"Feature","id":f"osm-way-{way['id']}-{index}","geometry":mapping(part),"properties":{"name":way.get("tags",{}).get("name"),"sourceId":f"way/{way['id']}","roadClass":way.get("tags",{}).get("highway","UNKNOWN"),"verificationStatus":"UNKNOWN"}})
    if len(features)>1000 or not features:
        raise ValueError("Road feature budget exceeded or empty")
    collection={"type":"FeatureCollection","features":features,"attribution":"© OpenStreetMap contributors","license":lock["license"],"sourceTimestamp":lock["sourceTimestamp"],"bbox":AOI}
    write_json(release/"normalized/roads.geojson",collection)
    write_json(release/"derived/roads.geojson",collection)
    write_json(release/"published/roads.geojson",collection)
    manifest={"version":VERSION,"processingVersion":"land-roads-1.0.0","sourceVersion":lock["sha256"],"sourceTimestamp":lock["sourceTimestamp"],"horizontalCrs":"EPSG:4326","aoi":AOI_EVIDENCE,"bbox":AOI,"features":len(features),"checksum":sha256(release/"published/roads.geojson"),"license":lock["license"],"attribution":"© OpenStreetMap contributors","verificationStatus":"UNKNOWN","sourceLock":lock}
    write_json(release/"manifest.json",manifest)
    print(json.dumps(manifest))

if __name__=="__main__":
    build()
