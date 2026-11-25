import { PerspectiveCamera, Scene, Vector3 } from "three";
import { createVisitor } from "./model";
import { createWalkSurface, type WalkGeometry } from "./surface";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const keys = new Map([
  ["w", "forward"], ["arrowup", "forward"], ["s", "back"], ["arrowdown", "back"],
  ["a", "left"], ["arrowleft", "left"], ["d", "right"], ["arrowright", "right"],
]);

export const createWalking = ({ canvas, camera, scene, shell, button, geometry, spawn, yaw: initialYaw = 0 }: {
  canvas: HTMLCanvasElement; camera: PerspectiveCamera; scene: Scene; shell: HTMLElement;
  button: HTMLButtonElement; geometry: WalkGeometry; spawn: readonly [number, number, number]; yaw?: number;
}) => {
  const visitor = createVisitor();
  const observationFov = camera.fov;
  visitor.root.visible = false;
  scene.add(visitor.root);
  const surface = createWalkSurface(geometry);
  const feet = new Vector3().fromArray(spawn);
  const desired = new Vector3();
  const focus = new Vector3();
  const focusOffset = new Vector3(0, 1.05, 0);
  const follow = new Vector3();
  const movement = new Vector3();
  const heldKeys = new Set<string>();
  const heldButtons = new Map<number, string>();
  const pointers = new Map<number, { x: number; y: number }>();
  const events = new AbortController();
  const pad = document.createElement("div");
  pad.className = "walk-pad";
  pad.setAttribute("role", "group");
  pad.setAttribute("aria-label", "人物移动");
  pad.hidden = true;
  const hint = document.createElement("p");
  hint.className = "walk-hint";
  hint.textContent = "WASD / 方向键或按住箭头移动 · 拖动环绕 · 双指 / 滚轮调距";
  pad.append(hint);
  const directions = [{ key: "forward", label: "向前走", text: "↑" }, { key: "left", label: "向左走", text: "←" }, { key: "back", label: "向后走", text: "↓" }, { key: "right", label: "向右走", text: "→" }];
  const padButtons = directions.map((entry) => {
    const control = document.createElement("button");
    control.type = "button";
    control.dataset.direction = entry.key;
    control.textContent = entry.text;
    control.setAttribute("aria-label", entry.label);
    control.addEventListener("pointerdown", (event) => {
      if (!available() || event.button !== 0) return;
      control.focus({ preventScroll: true });
      heldButtons.set(event.pointerId, entry.key);
      control.setPointerCapture(event.pointerId);
    }, { signal: events.signal });
    const release = (event: PointerEvent) => {
      heldButtons.delete(event.pointerId);
      if (control.hasPointerCapture(event.pointerId)) control.releasePointerCapture(event.pointerId);
    };
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"] as const) control.addEventListener(event, release, { signal: events.signal });
    control.addEventListener("keydown", (event) => {
      if (!available() || ![" ", "Enter"].includes(event.key)) return;
      if (event.repeat && !heldKeys.has(`button-${entry.key}`)) return;
      event.preventDefault();
      heldKeys.add(`button-${entry.key}`);
    }, { signal: events.signal });
    control.addEventListener("keyup", (event) => {
      if ([" ", "Enter"].includes(event.key)) heldKeys.delete(`button-${entry.key}`);
    }, { signal: events.signal });
    control.addEventListener("blur", () => heldKeys.delete(`button-${entry.key}`), { signal: events.signal });
    pad.append(control);
    return control;
  });
  shell.append(pad);
  let active = false;
  let suspended = false;
  let yaw = initialYaw;
  let elevation = 0.3;
  const defaultDistance = 3.1;
  let distance = defaultDistance;
  let heading = initialYaw;
  let pinchDistance = 0;
  let poseChanged = false;
  let wasMoving = false;
  const available = () => active && !suspended && !document.hidden && canvas.dataset.ready === "true";
  const clear = () => {
    heldKeys.clear();
    const captured = Array.from(heldButtons.keys());
    heldButtons.clear();
    for (const control of padButtons) {
      for (const identifier of captured) if (control.hasPointerCapture(identifier)) control.releasePointerCapture(identifier);
    }
    for (const identifier of pointers.keys()) if (canvas.hasPointerCapture(identifier)) canvas.releasePointerCapture(identifier);
    pointers.clear();
    pinchDistance = 0;
    canvas.style.cursor = "grab";
  };
  const orient = (delta: number, immediate: boolean) => {
    focus.copy(feet).add(focusOffset);
    if (immediate) follow.copy(focus);
    else {
      follow.lerp(focus, 1 - Math.exp(-14 * delta));
      if (follow.distanceToSquared(focus) < 0.00000001) follow.copy(focus);
    }
    desired.set(Math.sin(yaw) * Math.cos(elevation), Math.sin(elevation), Math.cos(yaw) * Math.cos(elevation)).multiplyScalar(distance).add(follow);
    const visibleDistance = surface.cameraDistance(follow, desired);
    visitor.setOpacity(clamp((visibleDistance - 0.45) / 0.7, 0, 1));
    camera.position.copy(desired.sub(follow).normalize().multiplyScalar(visibleDistance).add(follow));
    camera.lookAt(follow);
  };
  const reset = () => {
    clear();
    feet.fromArray(spawn);
    const height = surface.support(feet);
    if (height === undefined) throw new Error("The visitor spawn needs a supported floor");
    feet.y = height;
    yaw = initialYaw;
    heading = initialYaw;
    elevation = 0.3;
    distance = defaultDistance;
    visitor.reset();
    wasMoving = false;
    visitor.animate(0);
    visitor.root.position.copy(feet);
    visitor.root.rotation.y = heading;
    camera.fov = 50;
    camera.updateProjectionMatrix();
    orient(0, true);
    poseChanged = true;
  };
  const pinch = () => {
    const points = Array.from(pointers.values());
    return points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0;
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (!available() || event.button !== 0) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    pinchDistance = pinch();
    canvas.style.cursor = "grabbing";
  }, { signal: events.signal });
  canvas.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous || !available()) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      yaw -= (event.clientX - previous.x) * 0.006;
      elevation = clamp(elevation + (event.clientY - previous.y) * 0.003, 0.1, 0.65);
    } else if (pointers.size === 2) {
      const current = pinch();
      distance = clamp(distance - (current - pinchDistance) * 0.015, 1.4, 4.5);
      pinchDistance = current;
    }
  }, { signal: events.signal });
  const release = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    pinchDistance = pinch();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!pointers.size) canvas.style.cursor = "grab";
  };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"] as const) canvas.addEventListener(event, release, { signal: events.signal });
  canvas.addEventListener("wheel", (event) => {
    if (!available()) return;
    event.preventDefault();
    distance = clamp(distance + event.deltaY * 0.004, 1.4, 4.5);
  }, { passive: false, signal: events.signal });
  window.addEventListener("keydown", (event) => {
    if (!available() || event.altKey || event.ctrlKey || event.metaKey || !keys.has(event.key.toLowerCase())) return;
    if (event.repeat && !heldKeys.has(event.key.toLowerCase())) return;
    event.preventDefault();
    heldKeys.add(event.key.toLowerCase());
  }, { signal: events.signal });
  window.addEventListener("keyup", (event) => heldKeys.delete(event.key.toLowerCase()), { signal: events.signal });
  window.addEventListener("blur", clear, { signal: events.signal });
  window.addEventListener("pagehide", clear, { signal: events.signal });
  document.addEventListener("visibilitychange", clear, { signal: events.signal });
  const held = (direction: string) => Array.from(heldKeys).some((key) => keys.get(key) === direction || key === `button-${direction}`) || Array.from(heldButtons.values()).includes(direction);
  return {
    get active() { return active; },
    setEnabled: (enabled: boolean) => {
      clear();
      active = enabled;
      visitor.root.visible = enabled;
      pad.hidden = !enabled;
      if (!enabled && pad.contains(document.activeElement)) button.focus({ preventScroll: true });
      button.setAttribute("aria-pressed", String(enabled));
      document.body.dataset.travel = enabled ? "walk" : "observe";
      if (enabled) reset();
      else {
        camera.fov = observationFov;
        camera.updateProjectionMatrix();
      }
      poseChanged = true;
    },
    suspend: (enabled: boolean) => { suspended = enabled; clear(); },
    reset,
    update: (delta: number, immediate: boolean) => {
      if (!active) {
        const changed = poseChanged;
        poseChanged = false;
        return changed;
      }
      if (suspended) return false;
      const before = feet.clone();
      const previousHeading = heading;
      if (available()) {
        const forward = Number(held("forward")) - Number(held("back"));
        const right = Number(held("right")) - Number(held("left"));
        movement.set(-Math.sin(yaw) * forward + Math.cos(yaw) * right, 0, -Math.cos(yaw) * forward - Math.sin(yaw) * right);
        if (movement.lengthSq() > 0) {
          movement.normalize().multiplyScalar(1.35 * delta);
          const steps = Math.max(1, Math.ceil(movement.length() / 0.06));
          movement.divideScalar(steps);
          for (let step = 0; step < steps; step += 1) {
            surface.move(feet, new Vector3(movement.x, 0, 0));
            surface.move(feet, new Vector3(0, 0, movement.z));
          }
          const goal = Math.atan2(-movement.x, -movement.z);
          const turn = Math.atan2(Math.sin(goal - heading), Math.cos(goal - heading));
          heading += immediate ? turn : turn * (1 - Math.exp(-14 * delta));
        }
      }
      const traveled = feet.distanceTo(before);
      visitor.animate(traveled);
      visitor.root.position.copy(feet);
      visitor.root.rotation.y = heading;
      orient(delta, immediate);
      const changed = poseChanged || traveled > 0 || wasMoving || heading !== previousHeading;
      wasMoving = traveled > 0;
      poseChanged = false;
      return changed;
    },
    dispose: () => { clear(); events.abort(); visitor.dispose(); pad.remove(); delete document.body.dataset.travel; },
  };
};
