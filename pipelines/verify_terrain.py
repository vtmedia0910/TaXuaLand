"""Validate actual released bytes and shared edges; never marks field data verified."""
import json
import numpy as np
from common import ROOT, sha256
from terrain import VERSION

def verify():
    release = ROOT / "work/gis" / VERSION
    published = release / "published"
    manifest = json.loads((published / "manifest.json").read_text(encoding="utf8"))
    build = json.loads((release / "build.json").read_text(encoding="utf8"))
    assert sha256(published / "manifest.json") == build["manifestSha256"]
    seam_error = 0.0
    for level in range(manifest["maximumLevel"]+1):
        count = 2**level
        tiles = {}
        for y in range(count):
            for x in range(count):
                key=f"{level}/{x}/{y}.bin"
                path=published/key
                assert path.stat().st_size == manifest["tiles"][key]["bytes"]
                assert sha256(path) == manifest["tiles"][key]["sha256"]
                values=np.fromfile(path,dtype="<f4").reshape(65,65)
                assert np.isfinite(values).all()
                tiles[x,y]=values
                if x:
                    seam_error=max(seam_error,float(np.max(np.abs(tiles[x-1,y][:,-1]-values[:,0]))))
                if y:
                    seam_error=max(seam_error,float(np.max(np.abs(tiles[x,y-1][-1,:]-values[0,:]))))
    assert seam_error == 0
    assert build["qa"]["fieldControlPoints"] == "UNKNOWN"
    print(json.dumps({"tileChecksums":"PASS","seamErrorMeters":seam_error,"tiles":len(manifest["tiles"]),"fieldControlPoints":"UNKNOWN"}))

if __name__ == "__main__":
    verify()
