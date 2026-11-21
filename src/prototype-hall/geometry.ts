import {
  BoxGeometry, BufferGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute,
  Group, InstancedMesh, Mesh, MeshStandardMaterial, Object3D, PlaneGeometry, Scene, SphereGeometry,
} from "three";
import {
  BOOK_WALLS, COLUMNS, FULL_SPAN, GLASS_R, LAST_R, PALETTE, RISE, ROW_HEIGHT,
  STAIR_SPANS, TIERS, WALL_SPANS, ceilingY, crestY, polar, tangentRotation, terrainPoint, type Span,
} from "./layout";
import { oakTexture, plasterTexture, stoneTexture } from "./tex";
import { seedRng, span } from "./rnd";

type Elevation = number | ((radius: number, angle: number) => number);
type Surface = { front: number; back: number; height: Elevation; span: Span; warped?: boolean; rows?: number };
type Curtain = { radius: number; bottom: Elevation; top: Elevation; span: Span; warped?: boolean };
const heightAt = (height: Elevation, radius: number, angle: number) =>
  typeof height === "number" ? height : height(radius, angle);
const geometryOf = (positions: number[], uvs: number[], indices: number[]): BufferGeometry => {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};
const surface = ({ front, back, height, span: [start, end], warped = true, rows = 1 }: Surface): BufferGeometry => {
  const segments = Math.max(4, Math.ceil((end - start) * 150));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const pointAt = warped ? terrainPoint : polar;
  for (let row = 0; row <= rows; row += 1) {
    const radius = front + (back - front) * row / rows;
    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = start + (end - start) * segment / segments;
      const point = pointAt(radius, angle);
      positions.push(point.x, heightAt(height, radius, angle), point.z);
      uvs.push(segment / segments, row / rows);
      if (row < rows && segment < segments) {
        const index = row * (segments + 1) + segment;
        indices.push(index, index + segments + 1, index + 1, index + 1, index + segments + 1, index + segments + 2);
      }
    }
  }
  return geometryOf(positions, uvs, indices);
};
const curtain = ({ radius, bottom, top, span: [start, end], warped = true }: Curtain): BufferGeometry => {
  const segments = Math.max(4, Math.ceil((end - start) * 150));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const pointAt = warped ? terrainPoint : polar;
  for (let segment = 0; segment <= segments; segment += 1) {
    const angle = start + (end - start) * segment / segments;
    const point = pointAt(radius, angle);
    positions.push(point.x, heightAt(bottom, radius, angle), point.z, point.x, heightAt(top, radius, angle), point.z);
    uvs.push(segment / segments, 0, segment / segments, 1);
    if (segment < segments) {
      const index = segment * 2;
      indices.push(index, index + 1, index + 2, index + 1, index + 3, index + 2);
    }
  }
  return geometryOf(positions, uvs, indices);
};

export const buildHall = (scene: Scene): { lamps: MeshStandardMaterial } => {
  const root = new Group();
  root.name = "Book Mountain architecture";
  scene.add(root);
  const oak = new MeshStandardMaterial({ map: oakTexture([18, 2]), color: 0xe4cea7, roughness: 0.72, side: DoubleSide });
  const shelfWood = new MeshStandardMaterial({ map: oakTexture([9, 1]), color: 0xc7a67b, roughness: 0.76, side: DoubleSide });
  const backWood = new MeshStandardMaterial({ color: PALETTE.bookBack, roughness: 0.9, side: DoubleSide });
  const plaster = new MeshStandardMaterial({ map: plasterTexture([10, 5]), color: PALETTE.plaster, roughness: 0.96, side: DoubleSide });
  const floorStone = new MeshStandardMaterial({ map: stoneTexture([12, 12]), color: 0xd5d0c6, roughness: 0.85 });
  const trim = new MeshStandardMaterial({ color: 0x92978e, roughness: 0.58, metalness: 0.25, side: DoubleSide });
  const add = (name: string, geometry: BufferGeometry, material: MeshStandardMaterial, shadow = true) => {
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    root.add(mesh);
    return mesh;
  };
  add("Ground reading floor", surface({ front: GLASS_R, back: LAST_R + 0.6, height: 0, span: FULL_SPAN }), floorStone, false);
  for (const tier of TIERS) {
    for (const interval of tier.index === 0 ? [FULL_SPAN] : WALL_SPANS) {
      add(`Reading terrace ${tier.index + 1}`, surface({ front: tier.rFront, back: tier.rBack, height: tier.y, span: interval }), oak);
    }
    if (tier.index === 0) continue;
    for (const interval of STAIR_SPANS) {
      const length = 3.7;
      const steps = 12;
      for (let step = 0; step < steps; step += 1) {
        const front = tier.rFront + length * step / steps;
        const back = tier.rFront + length * (step + 1) / steps;
        const top = tier.baseY + RISE * (step + 1) / steps;
        add("Stair tread", surface({ front, back, height: top, span: interval }), oak);
        add("Stair riser", curtain({ radius: front, bottom: top - RISE / steps, top, span: interval }), shelfWood);
        add("Stair nosing", surface({ front: front - 0.015, back: front + 0.025, height: top + 0.006, span: interval }), trim, false);
      }
      add("Stair landing", surface({ front: tier.rFront + length, back: tier.rBack, height: tier.y, span: interval }), oak);
      for (const angle of interval) {
        const front = terrainPoint(tier.rFront, angle);
        const back = terrainPoint(tier.rFront + length, angle);
        add("Solid stair cheek", geometryOf([
          front.x, tier.baseY, front.z, back.x, tier.baseY, back.z,
          front.x, tier.baseY + 0.65, front.z, back.x, tier.y + 0.65, back.z,
        ], [0, 0, 1, 0, 0, 1, 1, 1], [0, 1, 2, 2, 1, 3]), shelfWood);
        add("Stair handrail cap", surface({
          front: tier.rFront, back: tier.rFront + length,
          height: (radius) => tier.baseY + 0.65 + (radius - tier.rFront) / length * RISE,
          span: [angle - 0.0012, angle + 0.0012],
        }), oak);
      }
    }
  }
  const partitions: { radius: number; angle: number; y: number; height: number }[] = [];
  for (const wall of BOOK_WALLS) {
    const shelfTop = wall.baseY + wall.rows * ROW_HEIGHT + 0.06;
    for (const interval of wall.spans) {
      add("Recessed bookcase back", curtain({ radius: wall.radius + 0.45, bottom: wall.baseY, top: (_, angle) => crestY(wall, angle), span: interval }), backWood);
      add("Undulating bookcase crest", curtain({ radius: wall.radius - 0.08, bottom: shelfTop, top: (_, angle) => crestY(wall, angle), span: interval }), oak);
      add("Bookcase crest cap", surface({ front: wall.radius - 0.08, back: wall.radius + 0.48, height: (_, angle) => crestY(wall, angle), span: interval }), shelfWood);
      for (const angle of interval) {
        const front = terrainPoint(wall.radius - 0.08, angle);
        const back = terrainPoint(wall.radius + 0.48, angle);
        const top = crestY(wall, angle);
        add("Closed bookcase end", geometryOf([
          front.x, wall.baseY, front.z, back.x, wall.baseY, back.z,
          front.x, top, front.z, back.x, top, back.z,
        ], [0, 0, 1, 0, 0, 1, 1, 1], [0, 1, 2, 2, 1, 3]), shelfWood);
      }
      for (let row = 0; row <= wall.rows; row += 1) {
        const height = wall.baseY + 0.04 + row * ROW_HEIGHT;
        add("Book shelf", surface({ front: wall.radius - 0.06, back: wall.radius + 0.45, height, span: interval }), shelfWood, false);
        add("Shelf edge", curtain({ radius: wall.radius - 0.08, bottom: height - 0.023, top: height + 0.018, span: interval }), trim, false);
      }
      const bays = Math.ceil((interval[1] - interval[0]) * wall.radius / 0.8);
      for (let bay = 0; bay <= bays; bay += 1) {
        partitions.push({ radius: wall.radius + 0.19, angle: interval[0] + (interval[1] - interval[0]) * bay / bays, y: wall.baseY + wall.rows * ROW_HEIGHT / 2, height: wall.rows * ROW_HEIGHT + 0.06 });
      }
    }
  }
  const dividers = new InstancedMesh(new BoxGeometry(1, 1, 1), trim, partitions.length);
  const transform = new Object3D();
  for (const [index, partition] of partitions.entries()) {
    const point = terrainPoint(partition.radius, partition.angle);
    transform.position.set(point.x, partition.y, point.z);
    transform.rotation.set(0, tangentRotation(partition.radius, partition.angle), 0);
    transform.scale.set(0.52, partition.height, 0.032);
    transform.updateMatrix();
    dividers.setMatrixAt(index, transform.matrix);
  }
  dividers.receiveShadow = true;
  root.add(dividers);
  add("Rear hall enclosure", curtain({ radius: LAST_R + 0.55, bottom: 0, top: ceilingY, span: FULL_SPAN }), plaster);
  add("Continuous curved ceiling", surface({ front: GLASS_R - 3, back: LAST_R + 1.6, height: ceilingY, span: [-0.445, 0.445], rows: 28 }), plaster);
  for (const angle of FULL_SPAN) {
    const front = polar(GLASS_R, angle);
    const back = terrainPoint(LAST_R + 0.55, angle);
    add("Side hall enclosure", geometryOf([
      front.x, 0, front.z, back.x, 0, back.z,
      front.x, ceilingY(GLASS_R, angle), front.z, back.x, ceilingY(LAST_R, angle), back.z,
    ], [0, 0, 1, 0, 0, 1, 1, 1], [0, 1, 2, 2, 1, 3]), plaster);
  }
  const glass = new MeshStandardMaterial({ color: PALETTE.glass, transparent: true, opacity: 0.09, roughness: 0.08, metalness: 0.1, side: DoubleSide, depthWrite: false });
  add("Lake-facing glazing", curtain({ radius: GLASS_R, bottom: 0, top: ceilingY, span: FULL_SPAN, warped: false }), glass, false);
  const mullionMaterial = new MeshStandardMaterial({ color: 0x616a6d, roughness: 0.55, metalness: 0.5, side: DoubleSide });
  for (let index = 0; index <= 40; index += 1) {
    const angle = FULL_SPAN[0] + (FULL_SPAN[1] - FULL_SPAN[0]) * index / 40;
    const point = polar(GLASS_R, angle);
    const height = ceilingY(GLASS_R, angle);
    const mullion = add("Glazing mullion", new BoxGeometry(0.085, height, 0.13), mullionMaterial);
    mullion.position.set(point.x, height / 2, point.z);
    mullion.rotation.y = angle;
  }
  for (const height of [3.15, 6.3]) {
    add("Glazing transom", curtain({ radius: GLASS_R, bottom: height, top: height + 0.065, span: FULL_SPAN, warped: false }), mullionMaterial, false);
  }
  const columnMaterial = new MeshStandardMaterial({ color: 0xf7f6ef, roughness: 0.65 });
  const lampMaterial = new MeshStandardMaterial({ color: PALETTE.lampGlow, emissive: PALETTE.lampGlow, emissiveIntensity: 0.8 });
  for (const column of COLUMNS) {
    const height = ceilingY(column.radius, column.angle);
    const shaft = add("White structural column", new CylinderGeometry(0.34, 0.4, height, 24), columnMaterial);
    shaft.position.set(column.x, height / 2, column.z);
    const ring = add("Column light collar", new CylinderGeometry(0.43, 0.43, 0.1, 24), trim, false);
    ring.position.set(column.x, height - 2.35, column.z);
    for (const offset of [-0.48, 0.48]) {
      const light = add("Column downlight", new BoxGeometry(0.15, 0.06, 0.17), lampMaterial, false);
      light.position.set(column.x + offset, height - 2.4, column.z);
    }
  }
  const downlights = new InstancedMesh(new SphereGeometry(0.052, 8, 6), lampMaterial, 40);
  let lightCount = 0;
  for (const radius of [74, 82, 92, 99]) {
    for (let index = 0; index < 10; index += 1) {
      const angle = -0.38 + index * 0.084;
      const point = polar(radius, angle);
      transform.position.set(point.x, ceilingY(radius, angle) - 0.09, point.z);
      transform.rotation.set(0, 0, 0);
      transform.scale.set(1, 0.45, 1);
      transform.updateMatrix();
      downlights.setMatrixAt(lightCount++, transform.matrix);
    }
  }
  root.add(downlights);
  const landscape = new Group();
  landscape.name = "Simplified lakeside context";
  root.add(landscape);
  const ground = new Mesh(new PlaneGeometry(600, 600), new MeshStandardMaterial({ color: 0xafb99e, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.22;
  landscape.add(ground);
  const lake = new Mesh(new PlaneGeometry(125, 360), new MeshStandardMaterial({ color: 0xaac8d2, roughness: 0.36, metalness: 0.25 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(82, -0.13, 0);
  landscape.add(lake);
  landscape.add(new Mesh(surface({ front: GLASS_R - 4.7, back: GLASS_R - 0.2, height: -0.04, span: [-0.6, 0.6], warped: false }), floorStone));
  const rng = seedRng(71);
  const skyline = new InstancedMesh(new BoxGeometry(1, 1, 1), new MeshStandardMaterial({ color: 0xd2dade, roughness: 1 }), 50);
  for (let index = 0; index < 50; index += 1) {
    const height = span(rng, 7, 29);
    transform.position.set(span(rng, 159, 195), height / 2, -175 + index * 7.1);
    transform.scale.set(span(rng, 5, 12), height, span(rng, 3, 7));
    transform.rotation.set(0, 0, 0);
    transform.updateMatrix();
    skyline.setMatrixAt(index, transform.matrix);
  }
  landscape.add(skyline);
  const trees = new InstancedMesh(new SphereGeometry(1, 8, 6), new MeshStandardMaterial({ color: 0x8fa17e, roughness: 1 }), 80);
  for (let index = 0; index < 80; index += 1) {
    transform.position.set(span(rng, 144, 153), span(rng, 1, 3), -160 + index * 4.1);
    transform.scale.set(span(rng, 1.6, 3.8), span(rng, 1.8, 3.7), span(rng, 2, 4));
    transform.updateMatrix();
    trees.setMatrixAt(index, transform.matrix);
  }
  landscape.add(trees);
  return { lamps: lampMaterial };
};
