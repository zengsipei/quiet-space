import {
  BoxGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
} from "three";
import { paperTexture, textBlockTexture } from "../lib/canvasTex";

export type Props = {
  lampAnchor: { position: { x: number; y: number; z: number } };
  lampShade: MeshStandardMaterial;
  update: (dt: number, t: number) => void;
};

const TABLE_Y = 0.74;

/** One long reading table, the desk lamp, the open book: everything the sample view frames. */
export const buildProps = (scene: Scene): Props => {
  const root = new Group();
  scene.add(root);

  const tableMat = new MeshStandardMaterial({ color: 0x5b4432, roughness: 0.55, metalness: 0.05 });

  const top = new Mesh(new BoxGeometry(5.4, 0.08, 1.5), tableMat);
  top.position.set(0, TABLE_Y, -1.0);
  top.castShadow = true;
  top.receiveShadow = true;
  root.add(top);

  const legMat = new MeshStandardMaterial({ color: 0x3d2f24, roughness: 0.7 });
  for (const x of [-2.5, 2.5]) {
    for (const z of [-1.65, -0.35]) {
      const leg = new Mesh(new BoxGeometry(0.12, TABLE_Y, 0.12), legMat);
      leg.position.set(x, TABLE_Y / 2, z);
      leg.castShadow = true;
      root.add(leg);
    }
  }

  // A low rail between the legs, so the table reads as furniture and not a slab.
  const rail = new Mesh(new BoxGeometry(5.0, 0.07, 0.07), legMat);
  rail.position.set(0, 0.18, -1.0);
  root.add(rail);

  // Chair, seen from the back at the near edge.
  const chairSeat = new Mesh(new BoxGeometry(0.56, 0.06, 0.5), new MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.7 }));
  chairSeat.position.set(0.55, 0.46, 0.05);
  chairSeat.castShadow = true;
  root.add(chairSeat);
  const backrest = new Mesh(new BoxGeometry(0.56, 0.5, 0.05), new MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.7 }));
  backrest.position.set(0.55, 0.72, 0.3);
  root.add(backrest);
  for (const x of [0.31, 0.79]) {
    for (const z of [-0.17, 0.27]) {
      const leg = new Mesh(new BoxGeometry(0.045, 0.46, 0.045), legMat);
      leg.position.set(x, 0.23, z);
      root.add(leg);
    }
  }

  // Book: two page blocks angled slightly, plus the spine and a bookmark ribbon.
  const bookRoot = new Group();
  bookRoot.position.set(-0.1, TABLE_Y + 0.045, -1.0);
  root.add(bookRoot);

  const pageTex = paperTexture();
  const textTex = textBlockTexture();
  const makeHalf = (side: -1 | 1) => {
    const g = new Group();
    const block = new Mesh(
      new BoxGeometry(0.42, 0.03, 0.6),
      new MeshStandardMaterial({ map: pageTex, color: 0xf0e6d2, roughness: 0.86 }),
    );
    block.position.set(side * 0.215, 0, 0);
    block.castShadow = true;
    block.receiveShadow = true;
    g.add(block);

    const face = new Mesh(
      new PlaneGeometry(0.4, 0.58),
      new MeshStandardMaterial({ map: textTex, roughness: 0.9, color: 0xe8dcc4 }),
    );
    face.rotation.x = -Math.PI / 2;
    face.position.set(side * 0.215, 0.016, 0);
    g.add(face);

    g.rotation.z = side * -0.045;
    return g;
  };
  bookRoot.add(makeHalf(-1), makeHalf(1));

  const ribbon = new Mesh(
    new PlaneGeometry(0.035, 0.22),
    new MeshStandardMaterial({ color: 0x8c3a2f, roughness: 0.8, side: 2 }),
  );
  ribbon.rotation.x = -Math.PI / 2;
  ribbon.rotation.z = 0.5;
  ribbon.position.set(0.12, 0.02, 0.18);
  bookRoot.add(ribbon);

  // Desk lamp: brass stem, enamel cone, warm emissive shade.
  const lampRoot = new Group();
  lampRoot.position.set(-0.95, TABLE_Y + 0.02, -1.32);
  root.add(lampRoot);

  const brass = new MeshStandardMaterial({ color: 0xb08d5a, roughness: 0.35, metalness: 0.8 });
  const base = new Mesh(new CylinderGeometry(0.11, 0.13, 0.035, 24), brass);
  base.position.y = 0.018;
  base.castShadow = true;
  lampRoot.add(base);

  const stem = new Mesh(new CylinderGeometry(0.014, 0.014, 0.42, 12), brass);
  stem.position.y = 0.23;
  lampRoot.add(stem);

  const shadeMat = new MeshStandardMaterial({
    color: 0x2f6b50,
    roughness: 0.5,
    metalness: 0.25,
    emissive: new Color(0xffb765),
    emissiveIntensity: 0.32,
    side: 2,
  });
  const shade = new Mesh(new CylinderGeometry(0.1, 0.19, 0.16, 24, 1, true), shadeMat);
  shade.position.set(0, 0.47, 0);
  lampRoot.add(shade);

  const bulb = new Mesh(
    new SphereGeometry(0.05, 12, 10),
    new MeshBasicMaterial({ color: 0xffd9a6 }),
  );
  bulb.position.set(0, 0.43, 0);
  lampRoot.add(bulb);

  // A small empty cup, a stack of closed books: signs someone was here.
  const cup = new Mesh(new CylinderGeometry(0.04, 0.032, 0.09, 16), new MeshStandardMaterial({ color: 0xe4dccd, roughness: 0.4 }));
  cup.position.set(1.1, TABLE_Y + 0.045, -0.9);
  cup.castShadow = true;
  root.add(cup);

  const stackCols = [0x6b4a37, 0x55665a, 0x8a6a48];
  for (let i = 0; i < 3; i += 1) {
    const b = new Mesh(
      new BoxGeometry(0.34, 0.055, 0.24),
      new MeshStandardMaterial({ color: stackCols[i], roughness: 0.75 }),
    );
    b.position.set(1.75 + i * 0.02, TABLE_Y + 0.03 + i * 0.058, -1.2 + i * 0.015);
    b.rotation.y = i * 0.08;
    b.castShadow = true;
    root.add(b);
  }

  let flicker = 0;
  return {
    lampAnchor: { position: { x: -0.95, y: TABLE_Y + 0.4, z: -1.32 } },
    lampShade: shadeMat,
    update: (dt, t) => {
      // Very slow breathing on the lamp: an incandescent, not an LED.
      flicker += dt;
      const wobble = Math.sin(t * 1.7) * 0.012 + Math.sin(t * 7.3) * 0.004;
      shadeMat.emissiveIntensity = 0.32 + wobble;
      void flicker;
    },
  };
};
