import { useState } from "react";
import Home from "./components/Home";
import MapView from "./components/MapView";

// 画面ルーター: ホーム → 各モード。3Dエンジン(MapView)は共通で、appMode で用途別に振る舞いを切り替える。
// terrain=地形 / celestial=太陽月 / ar=写真AR / live=カメラAR / offline=オフライン保存。
export type AppMode = "terrain" | "celestial" | "ar" | "live" | "offline";

export default function App() {
  const [screen, setScreen] = useState<"home" | AppMode>("home");
  if (screen === "home") return <Home onSelect={setScreen} />;
  return <MapView appMode={screen} onHome={() => setScreen("home")} />;
}
