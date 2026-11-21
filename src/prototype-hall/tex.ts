import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { seedRng } from "./rnd";

const canvasOf = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d canvas context unavailable");
  return [c, ctx];
};

const finish = (c: HTMLCanvasElement, repeat: [number, number]): CanvasTexture => {
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  return tex;
};

export const oakTexture = (repeat: [number, number] = [8, 2]): CanvasTexture => {
  const [c, ctx] = canvasOf(512, 512);
  const rng = seedRng(13);
  ctx.fillStyle = "#c0b59d";
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 260; i += 1) {
    const y = rng() * 512;
    const dark = rng() < 0.5;
    ctx.strokeStyle = dark
      ? "rgba(132,118,98," + (0.025 + rng() * 0.055).toFixed(3) + ")"
      : "rgba(236,228,205," + (0.025 + rng() * 0.05).toFixed(3) + ")";
    ctx.lineWidth = 0.6 + rng() * 2.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(140, y + (rng() - 0.5) * 10, 370, y + (rng() - 0.5) * 10, 512, y + (rng() - 0.5) * 6);
    ctx.stroke();
  }
  for (let i = 0; i < 14; i += 1) {
    ctx.strokeStyle = "rgba(146,131,110," + (0.025 + rng() * 0.04).toFixed(3) + ")";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(rng() * 512, rng() * 512, 5 + rng() * 12, 2 + rng() * 4, rng() * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  return finish(c, repeat);
};

export const plasterTexture = (repeat: [number, number] = [5, 3]): CanvasTexture => {
  const [c, ctx] = canvasOf(256, 256);
  const rng = seedRng(29);
  ctx.fillStyle = "#f8f5ee";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4200; i += 1) {
    const g = 228 + Math.floor(rng() * 24);
    ctx.fillStyle = "rgba(" + g + "," + (g - 3) + "," + (g - 11) + "," + (0.05 + rng() * 0.1).toFixed(3) + ")";
    ctx.fillRect(rng() * 256, rng() * 256, 1 + rng() * 2, 1 + rng() * 2);
  }
  return finish(c, repeat);
};

export const stoneTexture = (repeat: [number, number] = [6, 6]): CanvasTexture => {
  const [c, ctx] = canvasOf(256, 256);
  const rng = seedRng(37);
  ctx.fillStyle = "#b4afa6";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i += 1) {
    const g = 150 + Math.floor(rng() * 60);
    ctx.fillStyle = "rgba(" + g + "," + (g - 3) + "," + (g - 9) + "," + (0.06 + rng() * 0.12).toFixed(3) + ")";
    ctx.fillRect(rng() * 256, rng() * 256, 1 + rng() * 2.5, 1 + rng() * 2.5);
  }
  return finish(c, repeat);
};
