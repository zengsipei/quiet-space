import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { Vector2 } from "three";

/** Vignette, warm-highlight / cool-shadow split, and fine grain. Hand-rolled so nothing extra is installed. */
export class GradePass extends ShaderPass {
  constructor() {
    super({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new Vector2(1, 1) },
        time: { value: 0 },
        vignette: { value: 0.62 },
        grain: { value: 0.028 },
        warm: { value: 0.16 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float time;
        uniform float vignette;
        uniform float grain;
        uniform float warm;
        varying vec2 vUv;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

        void main() {
          vec3 c = texture2D(tDiffuse, vUv).rgb;
          float luma = dot(c, vec3(0.299, 0.587, 0.114));
          // cool shadow, warm highlight
          c += vec3(-0.012, 0.006, 0.028) * (1.0 - luma) * warm * 3.0;
          c += vec3(0.030, 0.016, -0.020) * luma * warm * 2.0;
          // gentle contrast shoulder
          c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
          // vignette
          vec2 d = (vUv - 0.5) * vec2(1.0, resolution.y / max(resolution.x, 1.0) * 1.0);
          float v = smoothstep(0.98, 0.28, length(d) * 1.35);
          c *= mix(1.0, v, vignette);
          // grain
          float n = hash(vUv * resolution + fract(time) * 91.7) - 0.5;
          c += n * grain;
          gl_FragColor = vec4(max(c, vec3(0.0)), 1.0);
        }
      `,
    });
    this.setSize(1, 1);
  }
  override setSize(w: number, h: number) {
    const u = this.uniforms.resolution.value as Vector2;
    u.set(w, h);
    return this;
  }
  override render(...args: Parameters<ShaderPass["render"]>) {
    this.uniforms.time.value = performance.now() / 1000;
    return super.render(...args);
  }
}
