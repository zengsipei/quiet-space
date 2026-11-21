import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  Scene,
  SpotLight,
} from "three";
import type { Props } from "./props";

export type Lighting = { update: (t: number) => void };

export const buildLighting = (scene: Scene, anchor: Props["lampAnchor"]): Lighting => {
  const hemi = new HemisphereLight(0xa9c4e6, 0x3c3a34, 1.05);
  scene.add(hemi);

  const amb = new AmbientLight(0x92a6bf, 0.62);
  scene.add(amb);

  const lake = new DirectionalLight(0xd2e4f6, 2.0);
  lake.position.set(2.5, 7.0, -13);
  lake.target.position.set(0, 1.1, 0);
  lake.castShadow = true;
  lake.shadow.mapSize.set(2048, 2048);
  lake.shadow.camera.left = -11;
  lake.shadow.camera.right = 11;
  lake.shadow.camera.top = 9;
  lake.shadow.camera.bottom = -4;
  lake.shadow.bias = -0.0006;
  lake.shadow.normalBias = 0.02;
  scene.add(lake, lake.target);

  const roof = new DirectionalLight(0xc3d5e8, 0.85);
  roof.position.set(-1, 9, 1.5);
  roof.target.position.set(0, 0.4, 0);
  scene.add(roof, roof.target);

  const lamp = new PointLight(0xffb765, 2.4, 9, 1.7);
  lamp.position.set(anchor.position.x, anchor.position.y, anchor.position.z);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(512, 512);
  lamp.shadow.bias = -0.002;
  lamp.shadow.normalBias = 0.03;
  scene.add(lamp);

  const pool = new SpotLight(0xffc98a, 1.5, 4.2, 0.62, 0.7, 1.4);
  pool.position.set(anchor.position.x, anchor.position.y, anchor.position.z);
  pool.target.position.set(-0.1, 0.78, -1.0);
  scene.add(pool, pool.target);

  return {
    update: (t) => {
      lamp.intensity = 2.35 + Math.sin(t * 1.7) * 0.05 + Math.sin(t * 7.3) * 0.018;
      pool.intensity = 1.48 + Math.sin(t * 1.7) * 0.03;
    },
  };
};
