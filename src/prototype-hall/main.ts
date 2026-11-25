import {
  ACESFilmicToneMapping, Mesh, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, Scene, WebGLRenderer,
} from "three";
import { buildFurnish } from "./furnish";
import { buildHall } from "./geometry";
import { FIRST_R, STAIR_SPANS, TREAD, VIEWS, terrainPoint, type View } from "./layout";
import { buildLights, type Atmosphere } from "./lighting";
import { createNavigation } from "./navigation";
import { createWind } from "./wind";
import { createRenderLoop } from "../lib/renderLoop";
import { createWalking } from "../visitor/walking";

const canvas = document.querySelector<HTMLCanvasElement>("#hall");
const viewBar = document.querySelector<HTMLElement>("#views");
const reset = document.querySelector<HTMLButtonElement>("#reset");
const walk = document.querySelector<HTMLButtonElement>("#walk");
const status = document.querySelector<HTMLElement>("#status");
const message = document.querySelector<HTMLElement>("#status-message");
const retry = document.querySelector<HTMLAnchorElement>("#retry");
const shell = document.querySelector<HTMLElement>("#space-ui");
const day = document.querySelector<HTMLButtonElement>("#day");
const dusk = document.querySelector<HTMLButtonElement>("#dusk");
const quiet = document.querySelector<HTMLButtonElement>("#quiet");
const exit = document.querySelector<HTMLButtonElement>("#exit-quiet");
const sound = document.querySelector<HTMLButtonElement>("#sound");
const soundNote = document.querySelector<HTMLElement>("#sound-note");
if (!canvas || !viewBar || !reset || !walk || !status || !message || !retry || !shell || !day || !dusk || !quiet || !exit || !sound || !soundNote) {
  throw new Error("The Book Mountain page shell is incomplete");
}

const start = () => {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const scene = new Scene();
  const camera = new PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 360);
  const hall = buildHall(scene);
  const furniture = buildFurnish(scene);
  const lighting = buildLights({ scene, renderer, lamps: hall.lamps });
  const navigation = createNavigation(canvas, camera);
  const stairAngle = (STAIR_SPANS[0][0] + STAIR_SPANS[0][1]) / 2;
  const spawn = terrainPoint(FIRST_R + TREAD * 0.6, stairAngle);
  const walking = createWalking({ canvas, camera, scene, shell, button: walk, geometry: { floors: hall.walk.floors, solids: [...hall.walk.solids, ...furniture] }, spawn: [spawn.x, 0.025, spawn.z], yaw: Math.PI / 2 + stairAngle });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  const wind = createWind();
  let isQuiet = false;
  let soundEnabled = false;
  let soundChange = 0;
  let renderingAvailable = true;
  const setQuiet = (enabled: boolean) => {
    walking.suspend(enabled);
    isQuiet = enabled;
    shell.hidden = enabled;
    shell.inert = enabled;
    exit.hidden = !enabled;
    quiet.setAttribute("aria-pressed", String(enabled));
    (enabled ? exit : quiet).focus({ preventScroll: true });
  };
  const setSound = async (enabled: boolean) => {
    soundEnabled = enabled;
    const change = ++soundChange;
    sound.setAttribute("aria-pressed", String(enabled));
    soundNote.hidden = true;
    try {
      await wind.setEnabled(enabled && renderingAvailable);
    } catch {
      if (change !== soundChange) return;
      soundEnabled = false;
      sound.setAttribute("aria-pressed", "false");
      soundNote.textContent = "暂时无法播放风声，仍可安静浏览。";
      soundNote.hidden = false;
      void wind.setEnabled(false);
    }
  };
  const setAtmosphere = (atmosphere: Atmosphere) => {
    lighting.set(atmosphere);
    document.body.dataset.atmosphere = atmosphere;
    day.setAttribute("aria-pressed", String(atmosphere === "day"));
    dusk.setAttribute("aria-pressed", String(atmosphere === "dusk"));
  };
  setAtmosphere("day");
  sound.setAttribute("aria-pressed", "false");
  quiet.setAttribute("aria-pressed", "false");
  day.addEventListener("click", () => setAtmosphere("day"), { signal: events.signal });
  dusk.addEventListener("click", () => setAtmosphere("dusk"), { signal: events.signal });
  quiet.addEventListener("click", () => setQuiet(true), { signal: events.signal });
  exit.addEventListener("click", () => setQuiet(false), { signal: events.signal });
  sound.addEventListener("click", () => { void setSound(!soundEnabled); }, { signal: events.signal });
  document.addEventListener("visibilitychange", () => { void setSound(soundEnabled); }, { signal: events.signal });
  window.addEventListener("pagehide", () => { void setSound(false); }, { signal: events.signal });
  let selected: View = VIEWS[0];
  const setWalking = (enabled: boolean) => {
    navigation.setEnabled(!enabled);
    walking.setEnabled(enabled);
    if (!enabled) navigation.set(selected);
  };
  const buttons = VIEWS.map((view) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", view.label);
    button.setAttribute("aria-keyshortcuts", view.key);
    button.innerHTML = `<span class="view-key">${view.key}</span><span>${view.label}</span>`;
    button.addEventListener("click", () => select(view), { signal: events.signal });
    viewBar.append(button);
    return { view, button };
  });
  const select = (view: View) => {
    setWalking(false);
    selected = view;
    navigation.set(view);
    for (const entry of buttons) entry.button.setAttribute("aria-pressed", String(entry.view === selected));
    canvas.dataset.view = view.key;
  };
  select(VIEWS[0]);
  const resetView = () => { if (walking.active) walking.reset(); else select(selected); };
  reset.addEventListener("click", resetView, { signal: events.signal });
  walk.addEventListener("click", () => setWalking(!walking.active), { signal: events.signal });
  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || !status.hidden) return;
    if (event.key.toLowerCase() === "q") { setQuiet(!isQuiet); return; }
    if (event.key === "Escape" && isQuiet) { setQuiet(false); return; }
    if (isQuiet && walking.active) return;
    if (isQuiet && event.key.toLowerCase() === "m") return;
    if (event.key === "Escape" && walking.active) { setWalking(false); return; }
    if (event.key.toLowerCase() === "m") { setWalking(!walking.active); return; }
    const view = VIEWS.find((preset) => preset.key === event.key);
    if (view) select(view);
    else if (event.key.toLowerCase() === "r") resetView();
  }, { signal: events.signal });
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }, { signal: events.signal });
  const showFailure = (text: string) => {
    renderingAvailable = false;
    canvas.dataset.ready = "false";
    status.hidden = false;
    message.textContent = text;
    retry.hidden = false;
    shell.inert = true;
    retry.focus({ preventScroll: true });
  };
  const loop = createRenderLoop((delta, elapsed) => {
    try {
      navigation.update(delta);
      if (walking.update(Math.min(elapsed, 0.25), motion.matches)) renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      if (!status.hidden) {
        const restoringFocus = document.activeElement === retry;
        status.hidden = true;
        retry.hidden = true;
        shell.inert = isQuiet;
        canvas.dataset.ready = "true";
        if (restoringFocus) (isQuiet ? exit : quiet).focus({ preventScroll: true });
      }
    } catch {
      walking.suspend(true);
      loop.pause();
      showFailure("暂时无法显示书山，请重新加载。");
      void setSound(false);
    }
  }, 0.1);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    walking.suspend(true);
    loop.pause();
    showFailure("画面暂时中断，正在等待恢复。也可以重新加载书山。");
    void setSound(soundEnabled);
  }, { signal: events.signal });
  canvas.addEventListener("webglcontextrestored", () => {
    walking.suspend(isQuiet);
    renderingAvailable = true;
    renderer.shadowMap.needsUpdate = true;
    loop.resume();
    void setSound(soundEnabled);
  }, { signal: events.signal });
  import.meta.hot?.dispose(() => {
    loop.dispose();
    events.abort();
    navigation.dispose();
    walking.dispose();
    wind.dispose();
    shell.hidden = false;
    shell.inert = false;
    exit.hidden = true;
    viewBar.replaceChildren();
    scene.traverse((object) => { if (object instanceof Mesh) object.geometry.dispose(); });
    renderer.dispose();
  });
};
try { start(); } catch {
  message.textContent = "无法打开三维空间，请使用支持 WebGL 的浏览器重试。";
  retry.hidden = false;
  status.classList.add("has-error");
}
