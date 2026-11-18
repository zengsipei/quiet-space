import { WebGLRenderer, Scene, PerspectiveCamera, ACESFilmicToneMapping, SRGBColorSpace, Vector2, PCFSoftShadowMap } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildRoom } from "./scene/room";
import { buildProps } from "./scene/props";
import { buildAtmosphere } from "./scene/atmosphere";
import { buildLighting } from "./scene/lighting";
import { GradePass } from "./post/grade";
import { LookControls } from "./lib/look";

const canvas = document.querySelector<HTMLCanvasElement>("#scene");
if (!canvas) throw new Error("missing #scene");

const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;

const scene = new Scene();
const camera = new PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.05, 220);

const room = buildRoom(scene);
const props = buildProps(scene);
const atmo = buildAtmosphere(scene, camera);
const lights = buildLighting(scene, props.lampAnchor);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), 0.42, 0.75, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new GradePass();
composer.addPass(grade);

const views = {
  "1": { pos: [0, 1.62, 5.6], target: [0, 1.15, -1.2], label: "全景" },
  "2": { pos: [0.0, 1.22, 0.35], target: [0.1, 1.0, -1.0], label: "桌面" },
  "3": { pos: [0.2, 1.55, -1.4], target: [0.6, 1.35, -9.2], label: "窗" },
  "4": { pos: [-2.6, 1.5, 2.4], target: [-7.5, 1.6, -4.0], label: "书山" },
} as const;

const controls = new LookControls(canvas, camera);
controls.set(views["1"]);

window.addEventListener("keydown", (e) => {
  const v = views[e.key as keyof typeof views];
  if (v) controls.set(v);
});

window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(w, h);
  grade.setSize(w, h);
});

const clock = { last: performance.now(), t: 0 };
const hint = document.querySelector<HTMLElement>("#hint");

const frame = () => {
  const now = performance.now();
  const dt = Math.min((now - clock.last) / 1000, 0.05);
  clock.last = now;
  clock.t += dt;
  controls.update(dt);
  atmo.update(dt, clock.t);
  lights.update(clock.t);
  props.update(dt, clock.t);
  room.update(clock.t);
  composer.render();
  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);
setTimeout(() => { if (hint) hint.style.opacity = "0.55"; }, 4000);
