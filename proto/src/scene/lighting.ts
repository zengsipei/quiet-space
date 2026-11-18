import {
  AmbientLight,
  Color,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  Scene,
  SpotLight,
} from "three";
import type { Props } from "./props";

export type Lighting = { update: (t: number) => void };

/** Warm lamp key, cool lake fill, low ambient: contrast comes from colour temperature, not brightness. */
export const buildLighting = (scene: Scene, anchor: Props["lampAnchor"]): Lighting => {
  const hemi = new HemisphereLight(0x2b3d56, 0x1a1410, 0.32);
  scene.add(hemi);

  const amb = new AmbientLight(0x2a3040, 0.35);
  scene.add(amb);

  // The lake: a wide, cold directional from the window, faint.
  const lake = new DirectionalLight(0x8fb6e0, 0.55);
  lake.position.set(1.5, 5.2, -12);
  lake.target.position.set(0, 1, 0);
  lake.castShadow = true;
  lake.shadow.mapSize.set(1024, 1024);
  lake.shadow.camera.left = -9;
  lake.shadow.camera.right = 9;
  lake.shadow.camera.top = 8;
  lake.shadow.camera.bottom = -3;
  lake.shadow.bias = -0.0008;
  lake.shadow.normalBias = 0.02;
  scene.add(lake, lake.target);

  // The lamp: point light under the shade, warm, short radius.
  const lamp = new PointLight(0xffb765, 2.6, 9, 1.7);
  lamp.position.set(anchor.position.x, anchor.position.y, anchor.position.z);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(512, 512);
  lamp.shadow.bias = -0.002;
  lamp.shadow.normalBias = 0.03;
  scene.add(lamp);

  // A soft pool on the tabletop, so the page is the brightest thing in frame.
  const pool = new SpotLight(0xffc98a, 1.4, 4.2, 0.62, 0.7, 1.4);
  pool.position.set(anchor.position.x, anchor.position.y, anchor.position.z);
  pool.target.position.set(-0.1, 0.78, -1.0);
  scene.add(pool, pool.target);

  // Faint bounce from the ceiling to keep the top of frame from going black.
  const bounce = new DirectionalLight(0x6b7a90, 0.18);
  bounce.position.set(0, 8, 2);
  scene.add(bounce);

  const warm = new Color(0xffb765);
  void warm;

  return {
    update: (t) => {
      lamp.intensity = 2.55 + Math.sin(t * 1.7) * 0.05 + Math.sin(t * 7.3) * 0.018;
      pool.intensity = 1.38 + Math.sin(t * 1.7) * 0.03;
    },
  };
};
