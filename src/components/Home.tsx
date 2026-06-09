// アプリのホーム画面。入場時に出し、ここから用途別モードへ分岐する。
import type { AppMode } from "../App";
import { CARDS } from "../modeCards";

type Props = { onSelect: (mode: AppMode) => void };

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
