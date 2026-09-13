import {
  assertAuthoritativeAoi,
  AUTHORITATIVE_AOI,
} from "./aoi-contract.ts";

const ITEM_ID = "S2C_T48QVJ_20260527T033930_L2A";
const PRODUCT_ID =
  "S2C_MSIL2A_20260527T032511_N0512_R018_T48QVJ_20260527T082311.SAFE";
const SOURCE_LOCK_SHA256 =
  "33aad31e8c02244c8d399add099bb337e8ad49e53f04b693bcdb0c9072b5a2c3";
const SOURCE_NAME =
  "Copernicus Sentinel-2 Collection 1 Level-2A Surface Reflectance / AWS Open Data COGs";
const SENSING_AT = "2026-05-27T03:42:16.849000Z";
const GENERATED_AT = "2026-05-27T08:23:11.000000Z";
const BBOX = [104.45, 21.2, 104.62, 21.35];
const ACQUISITION_NOTICE =
  "Sentinel-2 Cloud-Optimized GeoTIFFs was accessed on 2026-09-12 from https://registry.opendata.aws/sentinel-2-l2a-cogs.";
const ASSET_HASHES = {
  item: "1da384852518a7fdfb0480a419991c2ed00f43b6a0eef83f651148a5512637b1",
  visual: "d4ba26b4be3430e92ebc8c4e03657c228091a5ed1d4cf642897b4329ea2b63f2",
  scl: "33422ed1bc5c9314df348bdcfa322513d1faa40e07998085f42e01c470ee07c1",
} as const;
const ASSET_BYTES = { item: 17682, visual: 320168754, scl: 2543183 } as const;

type ManifestIdentity = {
  releaseVersion: string;
  sourceCrs: string;
  targetCrs: string;
  aoi: {
    id: string;
    version: string;
    srid: number;
    bbox: readonly number[];
    outsidePolicy: string;
    canonicalGeoJson: string;
    sha256: string;
    authoritySemantics: string;
  };
  bbox: readonly number[];
  quality: {
    sceneCloudPercent: number;
    obstructionThresholdPercent: number;
    aoiObstructionPercent: number;
    obstructionClasses: readonly number[];
    validPixelCount: number;
    obstructedPixelCount: number;
    nodataPixelCount: number;
    saturatedPixelCount: number;
    aoiContained: boolean;
  };
  rights: {
    licenseName: string;
    licenseReference: string;
    publicNotice: string;
    acquisitionNotice: string;
  };
  source: {
    name: string;
    collection: string;
    itemId: string;
    productId: string;
    sourceLockSha256: string;
    sensingAt: string;
    generatedAt: string;
    assets: Record<
      keyof typeof ASSET_HASHES,
      { sha256: string; bytes: number }
    >;
  };
};

export function assertApprovedImageryIdentity(manifest: ManifestIdentity) {
  if (
    manifest.releaseVersion !== "TX-IMAGERY-S2L2A-20260527T034216Z-001" ||
    manifest.source.name !== SOURCE_NAME ||
    manifest.source.collection !== "sentinel-2-c1-l2a" ||
    manifest.source.itemId !== ITEM_ID ||
    manifest.source.productId !== PRODUCT_ID ||
    manifest.source.sourceLockSha256 !== SOURCE_LOCK_SHA256 ||
    manifest.source.sensingAt !== SENSING_AT ||
    manifest.source.generatedAt !== GENERATED_AT
  )
    throw Error("Imagery Item identity mismatch");
  if (manifest.sourceCrs !== "EPSG:32648" || manifest.targetCrs !== "EPSG:3857")
    throw Error("Imagery CRS mismatch");
  assertAuthoritativeAoi(manifest.aoi);
  if (
    JSON.stringify(manifest.bbox) !== JSON.stringify(BBOX) ||
    JSON.stringify(manifest.bbox) !== JSON.stringify(manifest.aoi.bbox) ||
    manifest.quality.sceneCloudPercent !== 8.200835
  )
    throw Error("Imagery AOI or cloud identity mismatch");
  if (
    manifest.rights.licenseName !==
      "Copernicus Sentinel Data Legal Notice (rev. 1)" ||
    manifest.rights.licenseReference !==
      "https://cds.climate.copernicus.eu/licences/ec-sentinel" ||
    manifest.rights.publicNotice !==
      "Contains modified Copernicus Sentinel data 2026" ||
    manifest.rights.acquisitionNotice !== ACQUISITION_NOTICE
  )
    throw Error("Imagery rights identity mismatch");
  for (const [name, checksum] of Object.entries(ASSET_HASHES))
    if (
      manifest.source.assets[name as keyof typeof ASSET_HASHES]?.sha256 !==
        checksum ||
      manifest.source.assets[name as keyof typeof ASSET_HASHES]?.bytes !==
        ASSET_BYTES[name as keyof typeof ASSET_BYTES]
    )
      throw Error("Imagery source checksum mismatch");
}

export function assertApprovedImageryBuild(
  manifest: ManifestIdentity,
  build: {
    releaseVersion: string;
    sourceLockSha256: string;
    manifestSha256: string;
    qa: ManifestIdentity["quality"] & {
      itemId: string;
      aoiId: string;
      aoiVersion: string;
      aoiSha256: string;
      aoiPixelCount?: number;
      classPixelCounts?: Record<string, number>;
      verificationStatus: string;
      accuracy: string;
    };
  },
  manifestSha256: string,
) {
  const quality = manifest.quality,
    qa = build.qa;
  if (
    build.releaseVersion !== manifest.releaseVersion ||
    build.sourceLockSha256 !== manifest.source.sourceLockSha256 ||
    build.manifestSha256 !== manifestSha256 ||
    qa.itemId !== manifest.source.itemId ||
    qa.aoiId !== AUTHORITATIVE_AOI.id ||
    qa.aoiVersion !== AUTHORITATIVE_AOI.version ||
    qa.aoiSha256 !== AUTHORITATIVE_AOI.sha256 ||
    qa.verificationStatus !== "UNKNOWN" ||
    qa.accuracy !== "UNKNOWN"
  )
    throw Error("Imagery build identity mismatch");
  for (const key of [
    "sceneCloudPercent",
    "obstructionThresholdPercent",
    "aoiObstructionPercent",
    "validPixelCount",
    "obstructedPixelCount",
    "nodataPixelCount",
    "saturatedPixelCount",
    "aoiContained",
  ] as const)
    if (qa[key] !== quality[key]) throw Error("Imagery build QA mismatch");
  if (
    JSON.stringify(qa.obstructionClasses) !==
    JSON.stringify(quality.obstructionClasses)
  )
    throw Error("Imagery obstruction classes mismatch");
  if (
    qa.aoiPixelCount !== undefined &&
    qa.aoiPixelCount !==
      quality.validPixelCount +
        quality.nodataPixelCount +
        quality.saturatedPixelCount
  )
    throw Error("Imagery AOI pixel count mismatch");
  if (
    qa.classPixelCounts &&
    Object.values(qa.classPixelCounts).reduce(
      (total, count) => total + count,
      0,
    ) !== quality.obstructedPixelCount
  )
    throw Error("Imagery SCL class count mismatch");
}

function contains(
  ring: readonly (readonly number[])[],
  point: readonly number[],
) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!,
      [xj, yj] = ring[j]!;
    if (
      yi! > point[1]! !== yj! > point[1]! &&
      point[0]! < ((xj! - xi!) * (point[1]! - yi!)) / (yj! - yi!) + xi!
    )
      inside = !inside;
  }
  return inside;
}

export function assertAoiContained(
  itemRing: readonly (readonly number[])[],
  [west, south, east, north]: readonly [number, number, number, number],
) {
  if (
    ![
      [west, south],
      [west, north],
      [east, south],
      [east, north],
    ].every((point) => contains(itemRing, point))
  )
    throw Error("Imagery AOI is not fully contained");
}

export function obstructionPercent(obstructed: number, valid: number) {
  if (
    !Number.isInteger(obstructed) ||
    !Number.isInteger(valid) ||
    obstructed < 0 ||
    valid <= 0 ||
    obstructed > valid
  )
    throw Error("Invalid SCL counts");
  const percent = (obstructed / valid) * 100;
  if (percent > 10) throw Error("Imagery AOI obstruction exceeds 10%");
  return percent;
}
