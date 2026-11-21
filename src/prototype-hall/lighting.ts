import { AmbientLight, Color, DirectionalLight, Fog, HemisphereLight, MeshStandardMaterial, PointLight, Scene, WebGLRenderer } from "three";
import { PALETTE } from "./layout";

export type Atmosphere = "day" | "dusk";
type AtmosphereProfile = {
  background: number; exposure: number; hemisphere: number; ground: number;
  ambient: number; sunColor: number; sun: number; position: [number, number, number];
  sky: number; bounce: number; ceiling: number; lamps: number; reading: number;
};

const ATMOSPHERES = {
  day: {
    background: PALETTE.daylight, exposure: 1.12, hemisphere: 0.95, ground: 0xded9cb,
    ambient: 0.18, sunColor: 0xfff3d9, sun: 3.1, position: [48, 24, 18],
    sky: 0.48, bounce: 0.28, ceiling: 0.55, lamps: 0.6, reading: 0,
  },
  dusk: {
    background: 0x939bb2, exposure: 1.08, hemisphere: 0.42, ground: 0x806854,
    ambient: 0.12, sunColor: 0xffbb79, sun: 1.7, position: [48, 9, 32],
    sky: 0.24, bounce: 0.55, ceiling: 0.3, lamps: 2.8, reading: 32,
  },
} satisfies Record<Atmosphere, AtmosphereProfile>;

export const buildLights = ({ scene, renderer, lamps }: { scene: Scene; renderer: WebGLRenderer; lamps: MeshStandardMaterial }) => {
  const hemisphere = new HemisphereLight(0xedf4fa, 0xded9cb);
  const ambient = new AmbientLight(0xfff9ed);
  scene.add(hemisphere, ambient);
  const sun = new DirectionalLight();
  sun.target.position.set(-8, 3, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -54;
  sun.shadow.camera.right = 54;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -26;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 170;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.065;
  scene.add(sun, sun.target);
  const sky = new DirectionalLight(0xe1effb, 0.65);
  sky.position.set(25, 11, -40);
  sky.target.position.set(-12, 5, 0);
  scene.add(sky, sky.target);
  const bounce = new DirectionalLight(0xffead0, 0.45);
  bounce.position.set(-30, 7, 5);
  bounce.target.position.set(0, 6, -5);
  scene.add(bounce, bounce.target);
  const ceilingFill = new DirectionalLight(0xffffff, 1.1);
  ceilingFill.position.set(0, 1, 0);
  ceilingFill.target.position.set(0, 14, 0);
  scene.add(ceilingFill, ceilingFill.target);
  const readingLights = [[-7, 4, -16], [-12, 6, 9], [-22, 10, -6], [1, 4, 16]].map(([positionX, positionY, positionZ]) => {
    const light = new PointLight(0xffd49d, 0, 26, 2);
    light.position.set(positionX, positionY, positionZ);
    scene.add(light);
    return light;
  });
  const background = new Color();
  const fog = new Fog(background, 85, 290);
  scene.background = background;
  scene.fog = fog;
  const set = (atmosphere: Atmosphere) => {
    const preset = ATMOSPHERES[atmosphere];
    background.set(preset.background);
    fog.color.copy(background);
    renderer.toneMappingExposure = preset.exposure;
    hemisphere.intensity = preset.hemisphere;
    hemisphere.groundColor.set(preset.ground);
    ambient.intensity = preset.ambient;
    sun.color.set(preset.sunColor);
    sun.intensity = preset.sun;
    sun.position.fromArray(preset.position);
    sky.intensity = preset.sky;
    bounce.intensity = preset.bounce;
    ceilingFill.intensity = preset.ceiling;
    lamps.emissiveIntensity = preset.lamps;
    for (const light of readingLights) light.intensity = preset.reading;
    renderer.shadowMap.needsUpdate = true;
  };
  set("day");
  return { set };
};
