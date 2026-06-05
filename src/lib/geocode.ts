// 地名・住所検索（国土地理院 地名検索API・APIキー不要・CORS開放）。
//   https://msearch.gsi.go.jp/address-search/AddressSearch?q=<クエリ>
//   GeoJSON Feature 配列を返す。各 feature の geometry.coordinates は [lon, lat]、
//   properties.title が地名。山名・地名・住所が引ける。
//   出典表記:「地名検索：国土地理院」。

export type GeoResult = { title: string; lat: number; lon: number };

const URL = "https://msearch.gsi.go.jp/address-search/AddressSearch";

/** 地名検索。最大 limit 件を返す。失敗・該当なしは空配列。 */
export async function searchPlaces(query: string, limit = 8): Promise<GeoResult[]> {
  const q = query.trim();
  if (!q) return [];
  let res: Response;
  try {
    res = await fetch(`${URL}?q=${encodeURIComponent(q)}`, { mode: "cors" });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: GeoResult[] = [];
  for (const f of data) {
    const coords = f?.geometry?.coordinates;
    const title = f?.properties?.title;
    if (Array.isArray(coords) && coords.length >= 2 && typeof title === "string") {
      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) out.push({ title, lat, lon });
    }
    if (out.length >= limit) break;
  }
  return out;
}
