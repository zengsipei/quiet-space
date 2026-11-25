import { PerspectiveCamera, Vector3 } from "three";
import type { View } from "./layout";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const createNavigation = (canvas: HTMLCanvasElement, camera: PerspectiveCamera) => {
  const pointers = new Map<number, { x: number; y: number }>();
  const position = new Vector3();
  const direction = new Vector3();
  const target = new Vector3();
  const listeners = new AbortController();
  let baseYaw = 0;
  let basePitch = 0;
  let yaw = 0;
  let pitch = 0;
  let goalYaw = 0;
  let goalPitch = 0;
  let zoom = 52;
  let goalZoom = 52;
  let pinchDistance = 0;
  let enabled = true;
  const distance = () => {
    const points = Array.from(pointers.values());
    return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
  };
  const orient = () => {
    const heading = baseYaw + yaw;
    const elevation = clamp(basePitch + pitch, -1.1, 1.1);
    direction.set(Math.sin(heading) * Math.cos(elevation), Math.sin(elevation), Math.cos(heading) * Math.cos(elevation));
    camera.position.copy(position);
    camera.lookAt(target.copy(position).add(direction));
    if (camera.fov !== zoom) { camera.fov = zoom; camera.updateProjectionMatrix(); }
  };
  const set = (view: View) => {
    position.fromArray(view.pos);
    direction.fromArray(view.target).sub(position);
    baseYaw = Math.atan2(direction.x, direction.z);
    basePitch = Math.atan2(direction.y, Math.hypot(direction.x, direction.z));
    yaw = 0; pitch = 0; goalYaw = 0; goalPitch = 0; zoom = 52; goalZoom = 52;
    orient();
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (!enabled || event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    pinchDistance = distance();
  }, { signal: listeners.signal });
  canvas.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      goalYaw -= dx * 0.0027;
      goalPitch = clamp(goalPitch + dy * 0.0022, -0.55, 0.55);
    } else if (pointers.size === 2) {
      const current = distance();
      goalZoom = clamp(goalZoom - (current - pinchDistance) * 0.15, 32, 72);
      pinchDistance = current;
    }
  }, { signal: listeners.signal });
  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    pinchDistance = distance();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = pointers.size ? "grabbing" : "grab";
  };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
    canvas.addEventListener(event, release, { signal: listeners.signal });
  }
  canvas.addEventListener("wheel", (event) => {
    if (!enabled) return;
    event.preventDefault();
    goalZoom = clamp(goalZoom + event.deltaY * 0.035, 32, 72);
  }, { passive: false, signal: listeners.signal });
  return {
    set,
    setEnabled: (value: boolean) => {
      enabled = value;
      for (const identifier of pointers.keys()) if (canvas.hasPointerCapture(identifier)) canvas.releasePointerCapture(identifier);
      pointers.clear();
      pinchDistance = 0;
    },
    update: (dt: number) => {
      if (!enabled) return;
      const easing = 1 - Math.exp(-12 * dt);
      yaw += (goalYaw - yaw) * easing;
      pitch += (goalPitch - pitch) * easing;
      zoom += (goalZoom - zoom) * easing;
      if (Math.abs(goalYaw - yaw) < 0.0001) yaw = goalYaw;
      if (Math.abs(goalPitch - pitch) < 0.0001) pitch = goalPitch;
      if (Math.abs(goalZoom - zoom) < 0.005) zoom = goalZoom;
      orient();
    },
    dispose: () => listeners.abort(),
  };
};
