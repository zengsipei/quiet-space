import {
  BoxGeometry, Color, CylinderGeometry, Group, InstancedMesh, Mesh, MeshStandardMaterial,
  Object3D, Scene, SphereGeometry, Vector3,
} from "three";
import { BOOK_WALLS, COLUMNS, GLASS_R, PALETTE, ROW_HEIGHT, TIERS, TREAD, WALL_SPANS, tangentRotation, terrainPoint } from "./layout";
import { seedRng, span } from "./rnd";
import { oakTexture } from "./tex";

type Placement = { position: readonly [number, number, number]; size: readonly [number, number, number]; rotation: number };
const SPINES = [0xd6d3bd, 0xe2ddca, 0xbdb9a8, 0x6a7b6c, 0x596c7a, 0xb58764, 0x7b6253, 0x994f43, 0xd9c7a4, 0x414849];
const LEAVES = [0x759953, 0x698747, 0x577a42, 0x88a964];

export const buildFurnish = (scene: Scene): Mesh[] => {
  const root = new Group();
  root.name = "Books, reading furniture and interior trees";
  scene.add(root);
  const solids: Mesh[] = [];
  const rng = seedRng(53);
  const transform = new Object3D();
  const color = new Color();
  const capacity = BOOK_WALLS.reduce((count, wall) => count + wall.spans.reduce((total, interval) =>
    total + Math.ceil((interval[1] - interval[0]) * wall.radius / 0.8) * wall.rows * 8, 0), 0);
  const books = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ roughness: 0.86 }), capacity);
  books.name = "Seeded collection";
  books.receiveShadow = true;
  let bookCount = 0;
  for (const wall of BOOK_WALLS) {
    for (const interval of wall.spans) {
      const bays = Math.ceil((interval[1] - interval[0]) * wall.radius / 0.8);
      const bayAngle = (interval[1] - interval[0]) / bays;
      for (let bay = 0; bay < bays; bay += 1) {
        for (let row = 0; row < wall.rows; row += 1) {
          const count = 5 + Math.floor(rng() * 4);
          for (let book = 0; book < count; book += 1) {
            if (rng() < 0.07) continue;
            const angle = interval[0] + (bay + 0.1 + (book + 0.5) * 0.8 / count) * bayAngle;
            const point = terrainPoint(wall.radius + 0.17, angle);
            const height = span(rng, 0.22, 0.29);
            transform.position.set(point.x, wall.baseY + 0.058 + row * ROW_HEIGHT + height / 2, point.z);
            transform.rotation.set(0, tangentRotation(wall.radius, angle), 0);
            transform.scale.set(span(rng, 0.2, 0.28), height, bayAngle * wall.radius * 0.8 / count * span(rng, 0.7, 0.94));
            transform.updateMatrix();
            books.setMatrixAt(bookCount, transform.matrix);
            books.setColorAt(bookCount++, color.setHex(SPINES[Math.floor(rng() * SPINES.length)]));
          }
        }
      }
    }
  }
  books.count = bookCount;
  root.add(books);

  const wood = new MeshStandardMaterial({ map: oakTexture([2, 1]), color: 0xe4ccac, roughness: 0.65 });
  const chairWood = new MeshStandardMaterial({ color: 0xd2c6ad, roughness: 0.76 });
  const metal = new MeshStandardMaterial({ color: 0xa8aaa2, roughness: 0.38, metalness: 0.55 });
  const paper = new MeshStandardMaterial({ color: 0xe8e4d6, roughness: 0.95 });
  const glowing = new MeshStandardMaterial({ color: PALETTE.lampGlow, emissive: PALETTE.lampGlow, emissiveIntensity: 0.6, roughness: 0.6 });
  const desks: Placement[] = [];
  const chairs: Placement[] = [];
  const legs: Placement[] = [];
  const papers: Placement[] = [];
  const lamps: Placement[] = [];
  const chairAt = (x: number, y: number, z: number, rotation: number) => {
    chairs.push({ position: [x, y + 0.47, z], size: [0.49, 0.055, 0.51], rotation });
    chairs.push({ position: [x - Math.cos(rotation) * 0.23, y + 0.73, z + Math.sin(rotation) * 0.23], size: [0.052, 0.43, 0.5], rotation });
    for (const radial of [-0.19, 0.19]) {
      for (const tangent of [-0.2, 0.2]) {
        chairs.push({ position: [x + radial * Math.cos(rotation) + tangent * Math.sin(rotation), y + 0.23, z - radial * Math.sin(rotation) + tangent * Math.cos(rotation)], size: [0.035, 0.45, 0.035], rotation });
      }
    }
  };
  for (const tier of TIERS) {
    const radius = tier.rFront + 2.7;
    for (let index = 0; index < 9; index += 1) {
      const angle = -0.385 + index * 0.095;
      if (!WALL_SPANS.some(([start, end]) => angle > start + 0.025 && angle < end - 0.025)) continue;
      const point = terrainPoint(radius, angle);
      if (COLUMNS.some((column) => Math.hypot(column.x - point.x, column.z - point.z) < 1.8)) continue;
      const rotation = tangentRotation(radius, angle);
      desks.push({ position: [point.x, tier.y + 0.77, point.z], size: [0.88, 0.065, 3.25], rotation });
      for (const radial of [-0.33, 0.33]) {
        for (const tangent of [-1.35, 1.35]) {
          legs.push({ position: [point.x + radial * Math.cos(rotation) + tangent * Math.sin(rotation), tier.y + 0.38, point.z - radial * Math.sin(rotation) + tangent * Math.cos(rotation)], size: [0.04, 0.75, 0.04], rotation });
        }
      }
      for (const offset of [-0.85, 0.85]) {
        const seat = terrainPoint(radius + 1.03, angle + offset / radius);
        chairAt(seat.x, tier.y, seat.z, tangentRotation(radius, angle));
      }
      papers.push({ position: [point.x, tier.y + 0.812, point.z + 0.6], size: [0.44, 0.012, 0.32], rotation });
      legs.push({ position: [point.x + 0.18, tier.y + 1.02, point.z - 0.7], size: [0.026, 0.47, 0.026], rotation });
      lamps.push({ position: [point.x + 0.11, tier.y + 1.25, point.z - 0.7], size: [0.22, 0.028, 0.065], rotation });
    }
  }
  for (const column of COLUMNS.filter((_, index) => index % 3 !== 2)) {
    const tier = TIERS.find((entry) => column.radius >= entry.rFront && column.radius < entry.rBack);
    const y = tier?.y ?? 0;
    const top = new Mesh(new CylinderGeometry(1.0, 1.0, 0.055, 40), paper);
    top.position.set(column.x, y + 0.77, column.z);
    top.receiveShadow = true;
    root.add(top);
    solids.push(top);
    for (const angle of [0.25, 1.65, 3.6]) {
      chairAt(column.x + Math.cos(angle) * 1.3, y, column.z + Math.sin(angle) * 1.3, Math.PI - angle);
    }
  }
  const boxes = (name: string, material: MeshStandardMaterial, placements: Placement[]) => {
    const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), material, placements.length);
    mesh.name = name;
    for (const [index, placement] of placements.entries()) {
      transform.position.fromArray(placement.position);
      transform.scale.fromArray(placement.size);
      transform.rotation.set(0, placement.rotation, 0);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    }
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  solids.push(boxes("Reading desk tops", wood, desks), boxes("Timber reading chairs", chairWood, chairs));
  boxes("Desk legs and task-light stems", metal, legs);
  boxes("Open pages", paper, papers);
  boxes("Linear task lights", glowing, lamps);

  const treePositions = [
    ...[-0.35, -0.13, 0.1, 0.35].map((angle) => ({ radius: GLASS_R + 3.8, angle, y: 0 })),
    ...TIERS.filter((tier) => tier.index === 3).flatMap((tier) =>
      [-0.32, 0.32].map((angle) => ({ radius: tier.rFront + TREAD / 2, angle, y: tier.y })),
    ),
  ];
  const leafMaterial = new MeshStandardMaterial({ roughness: 0.95 });
  const trunkMaterial = new MeshStandardMaterial({ color: PALETTE.trunk, roughness: 0.94 });
  const potMaterial = new MeshStandardMaterial({ color: 0xa6a58f, roughness: 0.9 });
  const leaves = new InstancedMesh(new SphereGeometry(1, 6, 4), leafMaterial, treePositions.length * 240);
  const up = new Vector3(0, 1, 0);
  let leafCount = 0;
  for (const tree of treePositions) {
    const point = terrainPoint(tree.radius, tree.angle);
    const pot = new Mesh(new CylinderGeometry(0.54, 0.43, 0.57, 24), potMaterial);
    pot.position.set(point.x, tree.y + 0.285, point.z);
    pot.castShadow = true;
    root.add(pot);
    solids.push(pot);
    for (let branch = 0; branch < 5; branch += 1) {
      const angle = branch * 2.4;
      const start = new Vector3(point.x, tree.y + 0.5, point.z);
      const end = new Vector3(point.x + Math.cos(angle) * 0.65, tree.y + 3.6 + rng() * 0.45, point.z + Math.sin(angle) * 0.65);
      const direction = new Vector3().subVectors(end, start);
      const trunk = new Mesh(new CylinderGeometry(0.025, 0.052, direction.length(), 8), trunkMaterial);
      trunk.position.copy(start).add(end).multiplyScalar(0.5);
      trunk.quaternion.setFromUnitVectors(up, direction.normalize());
      trunk.castShadow = true;
      root.add(trunk);
    }
    for (let index = 0; index < 240; index += 1) {
      const angle = rng() * Math.PI * 2;
      const radial = Math.sqrt(rng()) * 1.35;
      transform.position.set(point.x + Math.cos(angle) * radial, tree.y + 2.65 + rng() * 1.6, point.z + Math.sin(angle) * radial);
      transform.scale.set(span(rng, 0.09, 0.18), span(rng, 0.13, 0.3), span(rng, 0.07, 0.18));
      transform.rotation.set(rng() * 3, rng() * 6, rng() * 3);
      transform.updateMatrix();
      leaves.setMatrixAt(leafCount, transform.matrix);
      leaves.setColorAt(leafCount++, color.setHex(LEAVES[Math.floor(rng() * LEAVES.length)]));
    }
  }
  leaves.receiveShadow = true;
  root.add(leaves);
  return solids;
};
