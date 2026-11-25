import { Raycaster, Vector3, type Intersection, type Mesh } from "three";

export type WalkGeometry = { floors: Mesh[]; solids: Mesh[] };

export const createWalkSurface = (geometry: WalkGeometry) => {
  const ray = new Raycaster();
  const hits: Intersection[] = [];
  const origin = new Vector3();
  const direction = new Vector3();
  const down = new Vector3(0, -1, 0);
  const cameraSolids = [...geometry.floors, ...geometry.solids];
  const radius = 0.25;
  const stepHeight = 0.23;
  const footprintDrop = stepHeight * 2;
  for (const mesh of cameraSolids) {
    mesh.updateWorldMatrix(true, false);
    mesh.geometry.computeBoundingBox();
  }
  const intersect = (meshes: Mesh[], distance: number) => {
    ray.near = 0;
    ray.far = distance;
    hits.length = 0;
    ray.intersectObjects(meshes, false, hits);
    return hits[0];
  };
  const heightAt = (point: Vector3) => {
    ray.set(origin.set(point.x, point.y + stepHeight + 0.02, point.z), down);
    const hit = intersect(geometry.floors, stepHeight * 2 + 0.04);
    return hit?.point.y;
  };
  const support = (point: Vector3) => {
    let height = heightAt(point);
    if (height === undefined) return undefined;
    for (const [offsetX, offsetZ] of [[radius, 0], [-radius, 0], [0, radius], [0, -radius]]) {
      ray.set(origin.set(point.x + offsetX, point.y + stepHeight + 0.02, point.z + offsetZ), down);
      const hit = intersect(geometry.floors, stepHeight + footprintDrop + 0.04);
      if (!hit) return undefined;
      height = Math.max(height, hit.point.y);
    }
    return height;
  };
  const move = (point: Vector3, movement: Vector3) => {
    const distance = movement.length();
    if (distance < 0.000001) return false;
    const next = point.clone().add(movement);
    const height = support(next);
    if (height === undefined || Math.abs(height - point.y) > stepHeight + 0.001) return false;
    direction.copy(movement).normalize();
    for (const offset of [-radius, 0, radius]) {
      for (const bodyHeight of [0.18, 0.5, 0.75, 1.1, 1.5]) {
        origin.set(point.x - direction.z * offset, Math.max(point.y, height) + bodyHeight, point.z + direction.x * offset);
        ray.set(origin, direction);
        const hit = intersect(geometry.solids, distance + radius);
        if (hit && hit.distance < distance + radius - 0.00001) return false;
      }
    }
    point.copy(next);
    point.y = height;
    return true;
  };
  return {
    support,
    move,
    cameraDistance: (target: Vector3, desired: Vector3) => {
      direction.subVectors(desired, target);
      const length = direction.length();
      ray.set(target, direction.normalize());
      const hit = intersect(cameraSolids, length + 0.18);
      return hit ? Math.max(0.2, Math.min(length, hit.distance - 0.18)) : length;
    },
  };
};
