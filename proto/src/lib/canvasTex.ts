import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { mulberry32 } from "./rng";

const canvasOf = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  return [c, ctx];
};

const finish = (c: HTMLCanvasElement, repeat?: [number, number]): CanvasTexture => {
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
};

/** Dark walnut floor with long grain. */
export const woodTexture = (repeat: [number, number] = [6, 9]): CanvasTexture => {
  const [c, ctx] = canvasOf(512, 512);
  const rng = mulberry32(11);
  ctx.fillStyle = "#4a3a2c";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 220; i += 1) {
    const y = rng() * 512;
    const h = 1 + rng() * 3;
    const dark = rng() < 0.55;
    ctx.fillStyle = dark ? `rgba(28,20,14,${0.10 + rng() * 0.22})` : `rgba(120,96,70,${0.05 + rng() * 0.12})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(140, y + (rng() - 0.5) * 12, 380, y + (rng() - 0.5) * 12, 512, y + (rng() - 0.5) * 8);
    ctx.lineWidth = h;
    ctx.stroke();
  }
  for (let i = 0; i <= 512; i += 128) {
    ctx.fillStyle = "rgba(14,10,7,0.55)";
    ctx.fillRect(0, i, 512, 2);
  }
  return finish(c, repeat);
};

/** Off-white paper with faint fibre. */
export const paperTexture = (): CanvasTexture => {
  const [c, ctx] = canvasOf(512, 512);
  const rng = mulberry32(7);
  ctx.fillStyle = "#d8cbb4";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i += 1) {
    ctx.fillStyle = `rgba(${160 + rng() * 60 | 0},${148 + rng() * 50 | 0},${126 + rng() * 40 | 0},${0.04 + rng() * 0.10})`;
    ctx.fillRect(rng() * 512, rng() * 512, 1 + rng() * 2, 1 + rng() * 2);
  }
  return finish(c, [1, 1]);
};

/** Unreadable letterpress block: the placeholder before real pages exist. */
export const textBlockTexture = (): CanvasTexture => {
  const [c, ctx] = canvasOf(256, 320);
  const rng = mulberry32(23);
  ctx.fillStyle = "#d6c9b2";
  ctx.fillRect(0, 0, 256, 320);
  ctx.fillStyle = "rgba(52,42,34,0.62)";
  for (let y = 22; y < 292; y += 13) {
    const left = y > 40 && y < 96 ? 34 : 24;
    ctx.fillRect(left, y, 256 - left - (24 + rng() * 30), 4.2);
  }
  ctx.fillStyle = "rgba(46,36,28,0.5)";
  ctx.fillRect(24, 10, 92, 5);
  return finish(c, [1, 1]);
};

/** Rain streaks to scroll down the outside of the glass. */
export const rainTexture = (): CanvasTexture => {
  const [c, ctx] = canvasOf(512, 512);
  const rng = mulberry32(41);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i += 1) {
    const x = rng() * 512;
    const y = rng() * 512;
    const len = 24 + rng() * 120;
    const a = 0.05 + rng() * 0.16;
    const grad = ctx.createLinearGradient(x, y, x, y + len);
    grad.addColorStop(0, "rgba(190,215,235,0)");
    grad.addColorStop(0.5, `rgba(200,222,240,${a})`);
    grad.addColorStop(1, "rgba(190,215,235,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 0.6 + rng() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rng() - 0.5) * 3, y + len);
    ctx.stroke();
  }
  const tex = finish(c, [3, 2]);
  return tex;
};

/** Night sky over the lake: deep navy with a pale snow ridge on the far shore. */
export const ridgeTexture = (): CanvasTexture => {
  const [c, ctx] = canvasOf(1024, 512);
  const rng = mulberry32(97);
  const sky = ctx.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, "#04070f");
  sky.addColorStop(0.45, "#0b1526");
  sky.addColorStop(0.72, "#16243a");
  sky.addColorStop(1, "#1d2c40");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1024, 512);

  for (let i = 0; i < 90; i += 1) {
    ctx.fillStyle = `rgba(215,230,250,${0.05 + rng() * 0.35})`;
    ctx.fillRect(rng() * 1024, rng() * 250, 1 + rng() * 1.4, 1 + rng() * 1.4);
  }

  const ridge = (baseY: number, amp: number, fill: string, snow: string) => {
    ctx.beginPath();
    ctx.moveTo(0, 512);
    let y = baseY;
    for (let x = 0; x <= 1024; x += 16) {
      y = baseY + Math.sin(x * 0.004 + amp) * amp * 0.6 + Math.sin(x * 0.017 + amp * 2) * amp * 0.32;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(1024, 512);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = snow;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, baseY - amp, 1024, amp * 0.75);
    ctx.restore();
  };

  ridge(330, 46, "#0d1a29", "#2c4460");
  ridge(300, 64, "#111f31", "#3d5b7d");
  ridge(270, 88, "#17293d", "#517495");
  return finish(c, [1, 1]);
};
