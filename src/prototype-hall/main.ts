import {
  ACESFilmicToneMapping, Mesh, PCFSoftShadowMap, PerspectiveCamera, SRGBColorSpace, Scene, WebGLRenderer,
} from "three";
import { buildFurnish } from "./furnish";
import { buildHall } from "./geometry";
import { VIEWS, type View } from "./layout";
import { buildLights, type Atmosphere } from "./lighting";
import { createNavigation } from "./navigation";
import { createWind } from "./wind";

const canvas = document.querySelector<HTMLCanvasElement>("#hall");
const viewBar = document.querySelector<HTMLElement>("#views");
const reset = document.querySelector<HTMLButtonElement>("#reset");
const status = document.querySelector<HTMLElement>("#status");
const shell = document.querySelector<HTMLElement>("#space-ui");
const day = document.querySelector<HTMLButtonElement>("#day");
const dusk = document.querySelector<HTMLButtonElement>("#dusk");
const quiet = document.querySelector<HTMLButtonElement>("#quiet");
const exit = document.querySelector<HTMLButtonElement>("#exit-quiet");
const sound = document.querySelector<HTMLButtonElement>("#sound");
const soundNote = document.querySelector<HTMLElement>("#sound-note");
if (!canvas || !viewBar || !reset || !status || !shell || !day || !dusk || !quiet || !exit || !sound || !soundNote) {
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
  buildFurnish(scene);
  const lighting = buildLights({ scene, renderer, lamps: hall.lamps });
  const navigation = createNavigation(canvas, camera);
  const events = new AbortController();
  const wind = createWind();
  let isQuiet = false;
  let soundEnabled = false;
  let soundChange = 0;
  const setQuiet = (enabled: boolean) => {
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
      await wind.setEnabled(enabled);
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
    selected = view;
    navigation.set(view);
    for (const entry of buttons) entry.button.setAttribute("aria-pressed", String(entry.view === selected));
    canvas.dataset.view = view.key;
  };
  select(VIEWS[0]);
  reset.addEventListener("click", () => select(selected), { signal: events.signal });
  window.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
    if (event.key.toLowerCase() === "q") { setQuiet(!isQuiet); return; }
    if (event.key === "Escape" && isQuiet) { setQuiet(false); return; }
    const view = VIEWS.find((preset) => preset.key === event.key);
    if (view) select(view);
    else if (event.key.toLowerCase() === "r") select(selected);
  }, { signal: events.signal });
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }, { signal: events.signal });
  let previous = performance.now();
  let frameId = 0;
  const frame = (now: number) => {
    const dt = Math.min((now - previous) / 1000, 0.1);
    previous = now;
    navigation.update(dt);
    renderer.render(scene, camera);
    if (!status.hidden) { status.hidden = true; canvas.dataset.ready = "true"; }
    frameId = requestAnimationFrame(frame);
  };
  frameId = requestAnimationFrame(frame);
  import.meta.hot?.dispose(() => {
    cancelAnimationFrame(frameId);
    events.abort();
    navigation.dispose();
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
  status.textContent = "无法打开三维空间，请使用支持 WebGL 的浏览器重试。";
  status.classList.add("has-error");
}
