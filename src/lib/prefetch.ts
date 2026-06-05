// 事前ロード（オフライン用タイルの一括ダウンロード）。
//
// 指定 bbox を MIN_PREFETCH_Z〜maxZ の各ズームでタイル化し、DEM と航空写真を
// Cache API に確保する。取得には demTiles/aerialTiles の prefetch 関数を使うので、
// オフライン時は通常の描画パスがそのままキャッシュから読める（特別な分岐は不要）。

import { type TileId, lonLatToTile, tileLonLatBounds, JAPAN_BBOX } from "./mercator";
import { prefetchDemTile, DEM_MAX_Z } from "./demTiles";
import { prefetchAerialTile, AERIAL_MAX_Z } from "./aerialTiles";

export type BBox = { latMin: number; latMax: number; lonMin: number; lonMax: number };
export type LonLat = { lat: number; lon: number };

const EQUATOR_KM = 40075.016686;

/** 2点間の概略距離(km, Haversine)。 */
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const p = Math.PI / 180;
  const dLat = (bLat - aLat) * p;
  const dLon = (bLon - aLon) * p;
  const la1 = aLat * p;
  const la2 = bLat * p;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// 概観も一緒に確保しておく最小ズーム（オフラインで引いた時に地図が出るように）。
const MIN_PREFETCH_Z = 5;
// プラン肥大化の安全弁（これを超えたら打ち切って truncated を立てる）。
const MAX_PLAN_TILES = 60000;
// サイズ目安（実測ベース。UIには「目安」と明記する）。
// GSIのDEM .txt は陸域でほぼ固定 512KB/枚（海域は404で0）。航空写真は概ね 40〜80KB/枚。
const DEM_AVG_BYTES = 512 * 1024;
const AERIAL_AVG_BYTES = 60 * 1024;

export type Job = { kind: "dem" | "aerial" } & TileId;
export type PrefetchPlan = {
  jobs: Job[];
  demCount: number;
  aerialCount: number;
  estBytes: number;
  truncated: boolean;
};

/** bbox を日本範囲にクランプ。交差が無ければ null。 */
function clampToJapan(b: BBox): BBox | null {
  const latMin = Math.max(b.latMin, JAPAN_BBOX.latMin);
  const latMax = Math.min(b.latMax, JAPAN_BBOX.latMax);
  const lonMin = Math.max(b.lonMin, JAPAN_BBOX.lonMin);
  const lonMax = Math.min(b.lonMax, JAPAN_BBOX.lonMax);
  if (latMin >= latMax || lonMin >= lonMax) return null;
  return { latMin, latMax, lonMin, lonMax };
}

/** bbox と最大ズームから、ダウンロードするタイル一覧（ズーム昇順）を作る。fetch はしない。 */
export function planPrefetch(bbox: BBox, maxZ: number): PrefetchPlan {
  const jobs: Job[] = [];
  let demCount = 0;
  let aerialCount = 0;
  let truncated = false;
  const clamped = clampToJapan(bbox);
  if (!clamped) return { jobs, demCount, aerialCount, estBytes: 0, truncated };

  outer: for (let z = MIN_PREFETCH_Z; z <= maxZ; z++) {
    const nw = lonLatToTile(clamped.latMax, clamped.lonMin, z); // 北西
    const se = lonLatToTile(clamped.latMin, clamped.lonMax, z); // 南東
    const xMin = Math.min(nw.x, se.x);
    const xMax = Math.max(nw.x, se.x);
    const yMin = Math.min(nw.y, se.y);
    const yMax = Math.max(nw.y, se.y);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        if (z <= AERIAL_MAX_Z) {
          jobs.push({ kind: "aerial", z, x, y });
          aerialCount++;
        }
        if (z <= DEM_MAX_Z) {
          jobs.push({ kind: "dem", z, x, y });
          demCount++;
        }
        if (jobs.length >= MAX_PLAN_TILES) {
          truncated = true;
          break outer;
        }
      }
    }
  }
  const estBytes = demCount * DEM_AVG_BYTES + aerialCount * AERIAL_AVG_BYTES;
  return { jobs, demCount, aerialCount, estBytes, truncated };
}

/** 中心＋半径(km)の円に重なるタイルを列挙する。bbox方式より無駄な隅を省ける。 */
export function planPrefetchDisk(center: LonLat, radiusKm: number, maxZ: number): PrefetchPlan {
  const jobs: Job[] = [];
  let demCount = 0;
  let aerialCount = 0;
  let truncated = false;

  const cosLat = Math.max(0.05, Math.cos((center.lat * Math.PI) / 180));
  const dLat = radiusKm / 111.32;
  const dLon = radiusKm / (111.32 * cosLat);
  const bbox = clampToJapan({
    latMin: center.lat - dLat,
    latMax: center.lat + dLat,
    lonMin: center.lon - dLon,
    lonMax: center.lon + dLon,
  });
  if (!bbox) return { jobs, demCount, aerialCount, estBytes: 0, truncated };

  outer: for (let z = MIN_PREFETCH_Z; z <= maxZ; z++) {
    // タイルの地上幅(km)。半径判定に半対角ぶんの余裕を足して縁のタイルも含める。
    const tileWidthKm = (EQUATOR_KM * cosLat) / 2 ** z;
    const margin = tileWidthKm * 0.71;
    const nw = lonLatToTile(bbox.latMax, bbox.lonMin, z);
    const se = lonLatToTile(bbox.latMin, bbox.lonMax, z);
    const xMin = Math.min(nw.x, se.x);
    const xMax = Math.max(nw.x, se.x);
    const yMin = Math.min(nw.y, se.y);
    const yMax = Math.max(nw.y, se.y);
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const b = tileLonLatBounds(z, x, y);
        const tcLat = (b.latN + b.latS) / 2;
        const tcLon = (b.lonW + b.lonE) / 2;
        if (haversineKm(center.lat, center.lon, tcLat, tcLon) > radiusKm + margin) continue;
        if (z <= AERIAL_MAX_Z) {
          jobs.push({ kind: "aerial", z, x, y });
          aerialCount++;
        }
        if (z <= DEM_MAX_Z) {
          jobs.push({ kind: "dem", z, x, y });
          demCount++;
        }
        if (jobs.length >= MAX_PLAN_TILES) {
          truncated = true;
          break outer;
        }
      }
    }
  }
  const estBytes = demCount * DEM_AVG_BYTES + aerialCount * AERIAL_AVG_BYTES;
  return { jobs, demCount, aerialCount, estBytes, truncated };
}

export type PrefetchProgress = { done: number; total: number; failed: number };

/** プランを並列ダウンロード。onProgress で進捗、signal で中断できる。 */
export async function runPrefetch(
  plan: PrefetchPlan,
  onProgress: (p: PrefetchProgress) => void,
  signal?: AbortSignal,
): Promise<PrefetchProgress> {
  const total = plan.jobs.length;
  let done = 0;
  let failed = 0;
  let i = 0;
  const CONCURRENCY = 8;

  const worker = async () => {
    while (i < total) {
      if (signal?.aborted) return;
      const job = plan.jobs[i++];
      const ok =
        job.kind === "dem"
          ? await prefetchDemTile(job.z, job.x, job.y)
          : await prefetchAerialTile(job.z, job.x, job.y);
      if (!ok) failed++;
      done++;
      onProgress({ done, total, failed });
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { done, total, failed };
}

/** バイト数を読みやすい文字列に。 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
