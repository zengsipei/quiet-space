import { PerspectiveCamera, Vector3 } from "three";

export type View = { pos: readonly [number, number, number]; target: readonly [number, number, number]; label: string };

export class LookControls {
  private yaw = 0;
  private pitch = 0;
  private targetYaw = 0;
  private targetPitch = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private readonly pos = new Vector3();
  private readonly look = new Vector3();
  private readonly goalPos = new Vector3();
  private readonly goalLook = new Vector3();

  constructor(canvas: HTMLCanvasElement, private camera: PerspectiveCamera) {
    canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    });
    canvas.addEventListener("pointerup", (e) => {
      this.dragging = false;
      canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = "grab";
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.targetYaw -= dx * 0.0022;
      this.targetPitch = clamp(this.targetPitch - dy * 0.0018, -0.42, 0.42);
    });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.dolly(clamp(e.deltaY * 0.0006, -0.35, 0.35));
    }, { passive: false });
  }

  set(v: View) {
    this.goalPos.set(v.pos[0], v.pos[1], v.pos[2]);
    this.goalLook.set(v.target[0], v.target[1], v.target[2]);
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.orient();
    this.pos.copy(this.goalPos);
    this.look.copy(this.goalLook);
  }

  private dolly(amount: number) {
    const dir = new Vector3().subVectors(this.goalPos, this.goalLook).normalize();
    this.goalPos.addScaledVector(dir, amount);
  }

  private orient() {
    const dir = new Vector3().subVectors(this.goalLook, this.goalPos);
    const dist = dir.length();
    const flat = Math.atan2(dir.x, dir.z);
    const pitchBase = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
    const yaw = flat + this.yaw;
    const pitch = clamp(pitchBase + this.pitch, -1.2, 1.1);
    const x = Math.sin(yaw) * Math.cos(pitch) * dist;
    const y = Math.sin(pitch) * dist;
    const z = Math.cos(yaw) * Math.cos(pitch) * dist;
    this.camera.position.set(this.goalLook.x + x, this.goalLook.y + y, this.goalLook.z + z);
    this.camera.lookAt(this.goalLook);
  }

  update(dt: number) {
    const k = 1 - Math.exp(-6 * dt);
    this.pos.lerp(this.goalPos, k);
    this.look.lerp(this.goalLook, k);
    this.yaw += (this.targetYaw - this.yaw) * k;
    this.pitch += (this.targetPitch - this.pitch) * k;
    this.orient();
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
