// 一覧カード用サムネの「生成専用」隠しハーネス（ルート #/__thumbs）。
// 1つの WebGLRenderer / QuadtreeTerrain を使い回し、window.__renderThumb(lat,lon,elevM)
// で山頂を南東やや上から見た“斜めの静止画”(webp dataURL)を返す。
// 本番表示には使わず、scripts でまとめてキャプチャ→ public/thumbs に保存する。
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { QuadtreeTerrain } from "../terrain/QuadtreeTerrain";
import { elevToWorldY, lonToMercX, latToMercY, mercXToWorld, mercYToWorld } from "../lib/mercator";

const W = 480;
const H = 270; // 16:9（カードのサムネ用。小さめで十分・軽量）

export default function ThumbStudio() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0d12);
    scene.fog = new THREE.Fog(0x0a0d12, 2200, 7200);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.15);
    sun.position.set(0.6, 1, 0.4).normalize().multiplyScalar(1000);
    scene.add(sun);
    const camera = new THREE.PerspectiveCamera(48, W / H, 0.05, 20000);
    const terrain = new QuadtreeTerrain(renderer);
    scene.add(terrain.group);

    // 山頂を南東やや上から望む“肖像”。順光（太陽は東〜南上）で陰影が出る向き。
    const renderThumb = (lat: number, lon: number, elevM: number) =>
      new Promise<string>((resolve) => {
        const tx = mercXToWorld(lonToMercX(lon));
        const tz = mercYToWorld(latToMercY(lat));
        const ty = elevToWorldY(Math.max(0, elevM - 250));
        const target = new THREE.Vector3(tx, ty, tz);
        const R = 6.5 + (elevM / 3800) * 4.5;
        const camH = elevToWorldY(elevM) + R * 0.42;
        const az = Math.PI * 0.27;
        const place = () => {
          camera.position.set(target.x + Math.cos(az) * R, camH, target.z + Math.sin(az) * R);
          camera.lookAt(target);
        };
        let frames = 0;
        let settled = 0;
        const tick = () => {
          place();
          // サムネ用に LOD を粗く（読み込むタイル数を抑えて高速化）。実画面より小さい画面高を渡す。
          terrain.update(camera, 150, camera.position.distanceTo(target));
          renderer.render(scene, camera);
          frames++;
          const s = terrain.getStats();
          if (s.loading === 0 && s.queued === 0 && frames > 12) settled++;
          else settled = 0;
          // タイルが落ち着いて数フレーム描けたら確定。保険の上限は短め（サムネは粗くてOK）。
          if (settled >= 3 || frames > 150) {
            place();
            renderer.render(scene, camera);
            resolve(renderer.domElement.toDataURL("image/webp", 0.78));
          } else {
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      });

    (window as unknown as { __renderThumb?: typeof renderThumb }).__renderThumb = renderThumb;
    (window as unknown as { __thumbReady?: boolean }).__thumbReady = true;

    return () => {
      const w = window as unknown as { __renderThumb?: unknown; __thumbReady?: unknown };
      delete w.__renderThumb;
      delete w.__thumbReady;
      terrain.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} style={{ position: "fixed", inset: 0, background: "#0a0d12" }} />;
}
