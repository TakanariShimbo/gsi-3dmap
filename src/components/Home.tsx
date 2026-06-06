// アプリのホーム画面。入場時に出し、ここから用途別モードへ分岐する。
// シミュレーション＝従来の地形ビュー。AR＝撮影画像に3D地形を重ねる。
// 「今撮る（ライブAR）」は将来枠のため当面は出さない。
import { IconMountain, IconImage } from "./icons";

type Props = { onSelect: (mode: "simulation" | "ar") => void };

export default function Home({ onSelect }: Props) {
  return (
    <div className="home">
      <div className="home-inner">
        <header className="home-head">
          <h1>GSI 3D Map</h1>
          <p>国土地理院の標高データで日本の地形を3D表示</p>
        </header>
        <div className="home-cards">
          <button className="home-card" onClick={() => onSelect("simulation")}>
            <span className="home-card-icon">
              <IconMountain size={30} />
            </span>
            <span className="home-card-title">シミュレーション</span>
            <span className="home-card-desc">地形を自由に俯瞰し、好きな地点に立って見回す</span>
          </button>
          <button className="home-card" onClick={() => onSelect("ar")}>
            <span className="home-card-icon">
              <IconImage size={30} />
            </span>
            <span className="home-card-title">AR（写真から）</span>
            <span className="home-card-desc">撮った写真に3D地形と山名を重ねて、どの山か確かめる</span>
          </button>
        </div>
      </div>
    </div>
  );
}
