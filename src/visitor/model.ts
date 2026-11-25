import {
  BoxGeometry, BufferGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute,
  Group, Mesh, MeshStandardMaterial, SphereGeometry,
} from "three";

const capePanel = (start: number, end: number, trim = false) => {
  const positions: number[] = [];
  const indices: number[] = [];
  const columns = 14;
  const rows = trim ? 1 : 8;
  for (let row = 0; row <= rows; row += 1) {
    const fall = trim ? 0.965 + row * 0.035 : row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const angle = start + (end - start) * column / columns;
      const radius = 0.2 + fall * 0.33 + (trim ? 0.002 : 0);
      const fold = Math.sin(angle * 5) * 0.018 * fall;
      positions.push(
        Math.sin(angle) * (radius + fold),
        1.23 - fall * 0.69 + Math.abs(Math.sin(angle)) * fall * 0.13,
        Math.cos(angle) * (radius + fold) + 0.025 + fall * 0.05,
      );
      if (row < rows && column < columns) {
        const vertex = row * (columns + 1) + column;
        indices.push(vertex, vertex + 1, vertex + columns + 1, vertex + 1, vertex + columns + 2, vertex + columns + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

export const createVisitor = () => {
  const root = new Group();
  root.name = "Cloaked book traveler";
  const body = new Group();
  body.position.y = -0.045;
  root.add(body);
  const pearl = new MeshStandardMaterial({ color: 0xeee3c9, roughness: 0.95 });
  const robe = new MeshStandardMaterial({ color: 0xc6cebe, roughness: 1 });
  const cape = new MeshStandardMaterial({ color: 0xb87c59, roughness: 0.98, side: DoubleSide });
  const trim = new MeshStandardMaterial({ color: 0xe5c58a, roughness: 0.9, side: DoubleSide });
  const mask = new MeshStandardMaterial({ color: 0x394b48, roughness: 0.9 });
  const boots = new MeshStandardMaterial({ color: 0x65756c, roughness: 1 });
  const glow = new MeshStandardMaterial({ color: 0xffeed0, emissive: 0xffdb98, emissiveIntensity: 0.55, roughness: 0.8 });
  const materials = [pearl, robe, cape, trim, mask, boots, glow];
  const add = (parent: Group, geometry: BufferGeometry, material: MeshStandardMaterial, position: readonly [number, number, number]) => {
    const mesh = new Mesh(geometry, material);
    mesh.position.fromArray(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const tunic = add(body, new CylinderGeometry(0.14, 0.23, 0.58, 16), robe, [0, 0.94, 0]);
  tunic.scale.z = 0.75;
  const hood = add(body, new SphereGeometry(0.245, 20, 16), pearl, [0, 1.365, 0]);
  hood.scale.set(0.96, 1.06, 0.9);
  const face = add(body, new SphereGeometry(0.18, 20, 16), mask, [0, 1.35, -0.207]);
  face.scale.set(0.88, 1.03, 0.25);
  for (const side of [-1, 1]) {
    const eye = add(body, new SphereGeometry(0.022, 10, 8), glow, [side * 0.065, 1.38, -0.248]);
    eye.scale.set(0.65, 1.2, 0.45);
  }
  const tuft = add(body, new SphereGeometry(0.105, 12, 10), pearl, [0.07, 1.56, 0.01]);
  tuft.scale.set(0.6, 1.05, 0.55);
  tuft.rotation.z = -0.6;
  const collar = add(body, new CylinderGeometry(0.16, 0.22, 0.1, 16), pearl, [0, 1.205, 0]);
  collar.scale.z = 0.78;
  const clasp = add(body, new BoxGeometry(0.065, 0.065, 0.026), trim, [0, 1.175, -0.165]);
  clasp.rotation.z = Math.PI / 4;
  const wings = [-1, 1].map((side) => {
    const wing = new Group();
    body.add(wing);
    const start = side < 0 ? -1.92 : 0;
    const end = side < 0 ? 0 : 1.92;
    add(wing, capePanel(start, end), cape, [0, 0, 0]);
    add(wing, capePanel(start, end, true), trim, [0, 0, 0]);
    return { wing, side };
  });
  const seal = add(body, new BoxGeometry(0.065, 0.12, 0.016), trim, [0, 0.99, 0.343]);
  seal.rotation.z = Math.PI / 4;
  const limbs = [-1, 1].map((side) => {
    const arm = new Group();
    arm.position.set(side * 0.215, 1.145, -0.02);
    arm.rotation.z = side * 0.12;
    body.add(arm);
    add(arm, new CylinderGeometry(0.052, 0.043, 0.29, 12), robe, [0, -0.14, 0]);
    add(arm, new SphereGeometry(0.052, 12, 10), pearl, [0, -0.305, 0]);
    const leg = new Group();
    leg.position.set(side * 0.1, 0.66, 0);
    body.add(leg);
    add(leg, new CylinderGeometry(0.072, 0.057, 0.27, 12), robe, [0, -0.12, 0]);
    const knee = new Group();
    knee.position.y = -0.25;
    leg.add(knee);
    add(knee, new CylinderGeometry(0.057, 0.048, 0.25, 12), boots, [0, -0.115, 0]);
    const foot = add(knee, new SphereGeometry(0.085, 12, 10), boots, [0, -0.31, -0.035]);
    foot.scale.set(0.85, 0.65, 1.5);
    return { arm, leg, knee, side };
  });
  let stride = 0;
  return {
    root,
    animate: (distance: number) => {
      stride += distance * 8.2;
      const moving = distance > 0;
      body.position.y = -0.045 + (moving ? Math.abs(Math.sin(stride)) * 0.018 : 0);
      for (const limb of limbs) {
        const swing = moving ? Math.sin(stride) * limb.side * 0.38 : 0;
        limb.leg.rotation.x = swing;
        limb.knee.rotation.x = -Math.max(0, -swing) * 0.7;
        limb.arm.rotation.x = -swing * 0.55;
      }
      for (const { wing, side } of wings) {
        wing.rotation.x = moving ? Math.abs(Math.sin(stride)) * 0.055 : 0;
        wing.rotation.z = moving ? Math.sin(stride) * side * 0.025 : 0;
      }
    },
    setOpacity: (opacity: number) => {
      for (const material of materials) {
        const transparent = opacity < 1;
        if (material.transparent !== transparent) {
          material.transparent = transparent;
          material.depthWrite = !transparent;
          material.needsUpdate = true;
        }
        material.opacity = opacity;
      }
    },
    reset: () => { stride = 0; },
    dispose: () => {
      root.traverse((object) => { if (object instanceof Mesh) object.geometry.dispose(); });
      for (const material of materials) material.dispose();
      root.removeFromParent();
    },
  };
};
