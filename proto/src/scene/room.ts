import {
  BoxGeometry,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
} from "three";
import { mulberry32, range } from "../lib/rng";
import { paperTexture, rainTexture, ridgeTexture, woodTexture } from "../lib/canvasTex";

export type Room = { update: (t: number) => void };

export const W = 15;
export const D = 13;
export const H = 4.3;
export const WIN_W = 11.4;
export const WIN_H = 3.5;
export const WIN_Z = -6.4;

const spinePalette = [0x6b4a37, 0x7d5c3f, 0x55665a, 0x8a6a48, 0x4b5b6b, 0x93795a, 0x6f5a52, 0x3f4a52];

/** Solid, low-poly interior: floor, slatted walls, beamed ceiling, the lake window and the book terraces. */
export const buildRoom = (scene: Scene): Room => {
  const root = new Group();
  scene.add(root);

  const floor = new Mesh(
    new PlaneGeometry(W, D),
    new MeshStandardMaterial({ map: woodTexture([7, 6]), roughness: 0.62, metalness: 0.04, color: 0xbda78f }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const wallMat = new MeshStandardMaterial({ color: 0xd9d3c6, roughness: 0.94, metalness: 0 });
  const sideWall = (x: number) => {
    const m = new Mesh(new PlaneGeometry(D, H), wallMat);
    m.position.set(x, H / 2, 0);
    m.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
    m.receiveShadow = true;
    root.add(m);
  };
  sideWall(-W / 2);
  sideWall(W / 2);

  const back = new Mesh(new PlaneGeometry(W, H), wallMat);
  back.position.set(0, H / 2, D / 2);
  back.rotation.y = Math.PI;
  back.receiveShadow = true;
  root.add(back);

  // Wall slats: the warm vertical rhythm of the reading hall.
  const slatMat = new MeshStandardMaterial({ color: 0x9c7d5c, roughness: 0.78 });
  const slatGeo = new BoxGeometry(0.05, H * 0.92, 0.1);
  for (let z = -D / 2 + 0.6; z < D / 2 - 0.2; z += 0.62) {
    for (const x of [-W / 2 + 0.06, W / 2 - 0.06]) {
      const s = new Mesh(slatGeo, slatMat);
      s.position.set(x, H * 0.46, z);
      root.add(s);
    }
  }

  // Ceiling and beams.
  const ceiling = new Mesh(
    new PlaneGeometry(W, D),
    new MeshStandardMaterial({ color: 0x2b2622, roughness: 0.95, side: DoubleSide }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  root.add(ceiling);

  const beamMat = new MeshStandardMaterial({ color: 0x4c3b2c, roughness: 0.86 });
  const beamGeo = new BoxGeometry(W - 0.2, 0.24, 0.13);
  for (let z = -D / 2 + 0.5; z < D / 2; z += 1.15) {
    const b = new Mesh(beamGeo, beamMat);
    b.position.set(0, H - 0.13, z);
    root.add(b);
  }

  // Window: glass, mullions, rain sheet, and the lake beyond.
  const glass = new Mesh(
    new PlaneGeometry(WIN_W, WIN_H),
    new MeshStandardMaterial({ color: 0x9fc3de, transparent: true, opacity: 0.1, roughness: 0.05, metalness: 0.4 }),
  );
  glass.position.set(0, WIN_H / 2 + 0.55, WIN_Z);
  root.add(glass);

  const rainTex = rainTexture();
  const rain = new Mesh(
    new PlaneGeometry(WIN_W, WIN_H),
    new MeshStandardMaterial({ map: rainTex, transparent: true, opacity: 0.5, roughness: 0.2, depthWrite: false }),
  );
  rain.position.set(0, WIN_H / 2 + 0.55, WIN_Z + 0.04);
  root.add(rain);

  const mullionMat = new MeshStandardMaterial({ color: 0x3a3630, roughness: 0.6, metalness: 0.3 });
  for (let i = 0; i <= 8; i += 1) {
    const m = new Mesh(new BoxGeometry(0.07, WIN_H, 0.1), mullionMat);
    m.position.set(-WIN_W / 2 + (WIN_W / 8) * i, WIN_H / 2 + 0.55, WIN_Z + 0.02);
    root.add(m);
  }
  for (const y of [1.55, 2.75]) {
    const m = new Mesh(new BoxGeometry(WIN_W, 0.05, 0.08), mullionMat);
    m.position.set(0, y, WIN_Z + 0.02);
    root.add(m);
  }

  const outside = new Mesh(
    new PlaneGeometry(64, 34),
    new MeshStandardMaterial({ map: ridgeTexture(), roughness: 1, metalness: 0, color: 0xcfdaea }),
  );
  outside.position.set(0, 12, WIN_Z - 22);
  root.add(outside);

  const lake = new Mesh(
    new PlaneGeometry(64, 24),
    new MeshStandardMaterial({ color: 0x0b1622, roughness: 0.22, metalness: 0.85 }),
  );
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(0, -0.6, WIN_Z - 11);
  root.add(lake);

  const color = new Color();
  const dummy = new Object3D();
  const rng = mulberry32(31);

  // Book terraces (the 书山): rising steps along the left wall.
  const stepMat = new MeshStandardMaterial({ map: paperTexture(), color: 0xcfc3ae, roughness: 0.9 });
  const stepH = 0.44;
  const stepD = 1.15;
  const stepW = 3.4;
  const startZ = -4.6;
  const stepCount = 6;
  const spinesPerStep = 22;
  const books = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.72 }), stepCount * spinesPerStep);
  books.castShadow = true;

  for (let i = 0; i < stepCount; i += 1) {
    const height = stepH * (i + 1);
    const z = startZ + i * stepD + stepD / 2;
    const step = new Mesh(new BoxGeometry(stepW, height, stepD), stepMat);
    step.position.set(-W / 2 + stepW / 2 + 0.1, height / 2, z);
    step.castShadow = true;
    step.receiveShadow = true;
    root.add(step);

    const h = stepH;
    for (let k = 0; k < spinesPerStep; k += 1) {
      const bh = range(rng, 0.22, 0.36);
      dummy.position.set(-W / 2 + 0.45 + k * 0.13, (i === 0 ? 0 : height - h) + bh / 2 + (i === 0 ? 0 : 0), z + stepD / 2 - 0.16);
      dummy.scale.set(0.09, bh, 0.22);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      const n = i * spinesPerStep + k;
      books.setMatrixAt(n, dummy.matrix);
      books.setColorAt(n, color.setHex(spinePalette[Math.floor(rng() * spinePalette.length)]));
    }
  }
  books.instanceMatrix.needsUpdate = true;
  if (books.instanceColor) books.instanceColor.needsUpdate = true;
  root.add(books);

  // Right wall shelves.
  const shelfMat = new MeshStandardMaterial({ color: 0x5a4634, roughness: 0.85 });
  for (const y of [0.95, 1.75, 2.55]) {
    const board = new Mesh(new BoxGeometry(0.34, 0.05, 7.2), shelfMat);
    board.position.set(W / 2 - 0.3, y, -0.6);
    root.add(board);
  }

  const shaftX = W / 2 - 0.62;
  const shelfBooks = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.74 }), 300);
  shelfBooks.receiveShadow = true;
  let sIdx = 0;
  for (const y of [1.0, 1.8, 2.6]) {
    for (let z = -4.1; z < 2.9; z += 0.11) {
      if (sIdx >= 300) break;
      const bh = range(rng, 0.2, 0.3);
      dummy.position.set(shaftX, y + bh / 2, z);
      dummy.scale.set(0.26, bh, 0.075);
      dummy.rotation.y = 0;
      dummy.updateMatrix();
      shelfBooks.setMatrixAt(sIdx, dummy.matrix);
      shelfBooks.setColorAt(sIdx, color.setHex(spinePalette[Math.floor(rng() * spinePalette.length)]));
      sIdx += 1;
    }
  }
  shelfBooks.count = sIdx;
  shelfBooks.instanceMatrix.needsUpdate = true;
  if (shelfBooks.instanceColor) shelfBooks.instanceColor.needsUpdate = true;
  root.add(shelfBooks);

  return {
    update: (t: number) => {
      rainTex.offset.y = -(t * 0.32) % 1;
      rainTex.offset.x = Math.sin(t * 0.17) * 0.02;
    },
  };
};
