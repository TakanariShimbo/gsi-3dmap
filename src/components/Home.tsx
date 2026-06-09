// アプリのホーム画面。入場時に出し、ここから用途別モードへ分岐する。
import { IconMountain, IconSun, IconImage, IconCamera, IconDownload } from "./icons";
import type { AppMode } from "../App";

type Props = { onSelect: (mode: AppMode) => void };

const CARDS: { mode: AppMode; icon: React.ReactNode; title: string; desc: string }[] = [
  {
    mode: "terrain",
    icon: <IconMountain size={26} />,
    title: "地形を見る",
    desc: "好きな場所の地形や山並みを立体的に眺め、その場に立った景色を見渡せます",
  },
  {
    mode: "celestial",
    icon: <IconSun size={26} />,
    title: "太陽・月の動きを見る",
    desc: "選んだ場所と日時で、太陽や月が見える方角・高さや、日の出・日の入りの時刻を確かめられます",
  },
  {
    mode: "ar",
    icon: <IconImage size={26} />,
    title: "写真に山名をのせる",
    desc: "撮った山の写真に名前を重ねて、「あの山は何？」を確かめ、名入りの一枚に仕上げます",
  },
  {
    mode: "live",
    icon: <IconCamera size={26} />,
    title: "カメラで山名を見る",
    desc: "目の前の山にカメラを向けると、見えている山の名前がその場でわかります",
  },
  {
    mode: "offline",
    icon: <IconDownload size={26} />,
    title: "オフライン保存",
    desc: "電波が届かない場所でも見られるよう、必要な範囲を前もって保存しておけます",
  },
];

export default function Home({ onSelect }: Props) {
  return (
    <div className="home">
      <div className="home-inner">
        <header className="home-head">
          <h1>Sangaku</h1>
          <p>日本の山を見て知る ― 3D地形・太陽と月・AR山名</p>
        </header>
        <div className="home-cards">
          {CARDS.map((c) => (
            <button key={c.mode} className="home-card" onClick={() => onSelect(c.mode)}>
              <span className="home-card-icon">{c.icon}</span>
              <span className="home-card-text">
                <span className="home-card-title">{c.title}</span>
                <span className="home-card-desc">{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
