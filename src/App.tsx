import { useRef, useState } from "react";
import Home from "./components/Home";
import MapView from "./components/MapView";
import SettingsScreen from "./components/SettingsScreen";
import Zukan from "./components/Zukan";
import { CARDS } from "./modeCards";
import { useSettings } from "./settings";

// 画面ルーター: ホーム → 各モード／設定。3Dエンジン(MapView)は共通で、appMode で用途別に振る舞いを切り替える。
// terrain=地形 / celestial=太陽月 / ar=写真AR / live=カメラAR / offline=オフライン保存。
export type AppMode = "terrain" | "celestial" | "ar" | "live" | "offline";
// ホームのカードから入れる画面（モード＋設定＋図鑑）。設定・図鑑はMapViewではなく専用画面。
export type Screen = "home" | AppMode | "settings" | "zukan";

const SCREENS: Screen[] = ["terrain", "celestial", "ar", "live", "offline", "settings", "zukan"];

// 共有リンク（ハッシュ）を解釈する。GitHub Pages（静的）でも動くようハッシュベース。
//   #/zukan, #/zukan?q=..&tag=.., #/zukan/123  … 図鑑（検索状態・個別ページは Zukan 側が読む）
//   #/terrain?lat=..&lon=.. / #/celestial?...  … その地点へフライト入場
function parseHash(): { screen: Screen; target: { lat: number; lon: number } | null } {
  const [path, query] = location.hash.replace(/^#\/?/, "").split("?");
  const seg = path.split("/")[0] as Screen;
  if (!SCREENS.includes(seg)) return { screen: "home", target: null };
  const p = new URLSearchParams(query);
  const lat = Number(p.get("lat")), lon = Number(p.get("lon"));
  const target = p.has("lat") && Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  return { screen: seg, target };
}

// 画面に応じてURL（ハッシュ）を書く。図鑑内の詳細・検索状態は Zukan 側が上書きする。
function writeHash(screen: Screen, target: { lat: number; lon: number } | null) {
  let hash = "";
  if (screen !== "home") {
    hash = `#/${screen}`;
    if (target && (screen === "terrain" || screen === "celestial")) {
      hash += `?lat=${target.lat.toFixed(5)}&lon=${target.lon.toFixed(5)}`;
    }
  }
  history.replaceState(null, "", location.pathname + location.search + hash);
}

export default function App() {
  // 起動時はURL（共有リンク）から画面を復元。通常起動はホーム。
  const [initial] = useState(parseHash);
  const [screen, setScreen] = useState<Screen>(initial.screen);
  // 表示設定（旧☰メニューの中身）。設定画面で変更し、各モードへ引き継ぐ。
  const [settings, setSettings] = useSettings();
  // ホーム⇄各画面の遷移を暗転でつなぐ。地図⇄風景と同じ演出で、入る時は行き先カードを出す。
  const [fade, setFade] = useState(0);
  const [card, setCard] = useState<{ icon: React.ReactNode; title: string; loading: boolean } | null>(null);
  // 図鑑→地形/太陽月 連携: 入場時にフライトする地点（通常入場では null。共有リンクからも復元）。
  const [mapTarget, setMapTarget] = useState<{ lat: number; lon: number } | null>(initial.target);
  const busyRef = useRef(false);

  const navigate = (target: Screen, mapTargetForMode?: { lat: number; lon: number }) => {
    if (busyRef.current || target === screen) return;
    busyRef.current = true;
    setMapTarget(mapTargetForMode ?? null);
    writeHash(target, mapTargetForMode ?? null); // 共有できるよう現在画面をURLに反映
    // 3D読込を伴うのはMapViewの各モードのみ。設定・図鑑は読込なしで素早く開く（図鑑の3Dは詳細ページで遅延）。
    const heavy = target !== "home" && target !== "settings" && target !== "zukan";
    // 入る時は行き先のカードを表示。ホームへ戻る時はカードなしでサッと暗転。
    const meta = target === "home" ? null : CARDS.find((c) => c.mode === target);
    setCard(meta ? { icon: meta.icon, title: meta.title, loading: heavy } : null);
    setFade(1); // 暗転（CSS 0.32s）
    window.setTimeout(() => {
      setScreen(target); // 暗転中に画面を入れ替え（MapView初期化・3D読込のチラつきも隠す）
      window.setTimeout(
        () => {
          setFade(0); // 明転
          busyRef.current = false;
          window.setTimeout(() => setCard(null), 360);
        },
        heavy ? 900 : 260, // モードは初期化を待って長めに黒を保持。ホーム/設定は短く。
      );
    }, 320);
  };

  return (
    <>
      {screen === "home" ? (
        <Home onSelect={navigate} />
      ) : screen === "settings" ? (
        <SettingsScreen settings={settings} onChangeSettings={setSettings} onHome={() => navigate("home")} />
      ) : screen === "zukan" ? (
        <Zukan onHome={() => navigate("home")} onOpenMap={(mode, target) => navigate(mode, target)} />
      ) : (
        <MapView appMode={screen} onHome={() => navigate("home")} settings={settings} initialTarget={mapTarget} />
      )}
      {/* ホーム⇄各画面の暗転フェード（最前面）。入る時は行き先カードを出す。 */}
      <div className={`screen-fade${fade ? " is-on" : ""}`} style={{ opacity: fade }} aria-hidden="true">
        {card && (
          <div className="view-fade-card">
            <span className="view-fade-ico">{card.icon}</span>
            <span className="view-fade-name">{card.title}</span>
          </div>
        )}
        {card?.loading && <span className="fade-loading">読み込み中</span>}
      </div>
    </>
  );
}
