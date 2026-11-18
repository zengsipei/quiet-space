import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  FogExp2,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  PerspectiveCamera,
} from "three";
import { mulberry32, range } from "../lib/rng";

export type Atmosphere = { update: (dt: number, t: number) => void };

/** Fog, dust motes and a faint warm haze around the window: the 光遇 layer, not the architecture. */
export const buildAtmosphere = (scene: Scene, camera: PerspectiveCamera): Atmosphere => {
  scene.fog = new FogExp2(0x161d27, 0.028);

  const root = new Group();
  scene.add(root);

  const rng = mulberry32(71);
  const COUNT = 900;
  const pos = new Float32Array(COUNT * 3);
  const drift = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i += 1) {
    pos[i * 3] = range(rng, -7.2, 7.2);
    pos[i * 3 + 1] = range(rng, 0.05, 3.6);
    pos[i * 3 + 2] = range(rng, -6.3, 6.3);
    drift[i * 3] = range(rng, -0.02, 0.02);
    drift[i * 3 + 1] = range(rng, 0.004, 0.018);
    drift[i * 3 + 2] = range(rng, -0.02, 0.02);
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));

  const motes = new Points(
    geo,
    new PointsMaterial({
      color: 0xe8d7b8,
      size: 0.022,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  root.add(motes);

  // A cheap glow sheet just inside the glass: light bleeding in from the lake side.
  const sheet = new Mesh(
    new PlaneGeometry(12.5, 4.2),
    new MeshBasicMaterial({ color: 0x3d5d86, transparent: true, opacity: 0.1, depthWrite: false, side: 2 }),
  );
  sheet.position.set(0, 2.0, -6.9);
  root.add(sheet);

  camera.updateProjectionMatrix();

  return {
    update: (dt, t) => {
      const arr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < COUNT; i += 1) {
        arr[i * 3] += drift[i * 3] * dt;
        arr[i * 3 + 1] += drift[i * 3 + 1] * dt;
        arr[i * 3 + 2] += drift[i * 3 + 2] * dt;
        if (arr[i * 3 + 1] > 3.8) arr[i * 3 + 1] = 0.05;
        if (arr[i * 3] > 7.2) arr[i * 3] = -7.2;
        if (arr[i * 3] < -7.2) arr[i * 3] = 7.2;
        if (arr[i * 3 + 2] > 6.3) arr[i * 3 + 2] = -6.3;
        if (arr[i * 3 + 2] < -6.3) arr[i * 3 + 2] = 6.3;
      }
      geo.attributes.position.needsUpdate = true;
      const mat = motes.material as PointsMaterial;
      mat.opacity = 0.42 + Math.sin(t * 0.31) * 0.08;
      const sm = sheet.material as MeshBasicMaterial;
      sm.opacity = 0.085 + Math.sin(t * 0.13) * 0.015;
    },
  };
};
