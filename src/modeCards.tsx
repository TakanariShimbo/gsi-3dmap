// 用途別モードのカード定義（ホーム画面の一覧と、画面遷移の暗転カードで共用）。
import { IconMountain, IconSun, IconImage, IconCamera, IconDownload } from "./components/icons";
import type { AppMode } from "./App";

export const CARDS: { mode: AppMode; icon: React.ReactNode; title: string; desc: string }[] = [
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
