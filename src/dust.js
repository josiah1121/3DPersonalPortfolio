// src/dust.js — SPACIOUS, ELEGANT FLOATING EMBERS (final version)
import * as THREE from 'three';

let scene;
let dustSystem;

const DUST_COUNT = 4000;           // Fewer = more elegant
const SPREAD_X = 3500;             // Wide left/right — covers full screen
const SPREAD_Z = 4000;             // Forward/backward depth
const HEIGHT_MIN = 0;
const HEIGHT_MAX = 1400;

export function initDust(_scene) {
  scene = _scene;

  const positions = new Float32Array(DUST_COUNT * 3);
  const sizes = new Float32Array(DUST_COUNT);
  const phase = new Float32Array(DUST_COUNT);
  const speed = new Float32Array(DUST_COUNT);
  const bobAmp = new Float32Array(DUST_COUNT);

  for (let i = 0; i < DUST_COUNT; i++) {
    // Wide horizontal spread — fills left and right of screen
    positions[i * 3]     = (Math.random() - 0.5) * SPREAD_X;
    positions[i * 3 + 1] = HEIGHT_MIN + Math.random() * (HEIGHT_MAX - HEIGHT_MIN);
    positions[i * 3 + 2] = -600 + (Math.random() - 0.5) * SPREAD_Z;

    sizes[i] = 5.2 + Math.random() * 7.8;
    phase[i] = Math.random() * 1000;
    speed[i] = 0.25 + Math.random() * 0.55;
    bobAmp[i] = 12 + Math.random() * 28;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute('speed', new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute('bobAmp', new THREE.BufferAttribute(bobAmp, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      attribute float phase;
      attribute float speed;
      attribute float bobAmp;
      uniform float time;
      varying float vAlpha;

      void main() {
        vec3 pos = position;

        float t = time * speed + phase;

        // Slow, dreamy rising + gentle sway
        pos.y += sin(t * 0.7) * bobAmp * 0.9;
        pos.x += sin(t * 0.4) * 18.0;
        pos.z += cos(t * 0.5) * 12.0;

        // Ember pulse — warm and alive
        vAlpha = 0.3 + sin(t * 2.8) * 0.3;
        vAlpha = clamp(vAlpha, 0.22, 0.78);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;

        // Hot white core → warm orange → deep red rim
        float dist = length(gl_PointCoord - vec2(0.5));
        vec3 color = mix(vec3(1.0, 0.95, 0.8), vec3(1.0, 0.4, 0.15), dist * 1.8);
        color = mix(color, vec3(0.9, 0.2, 0.1), dist * 0.8);

        gl_FragColor = vec4(color, vAlpha * 0.72);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
  });

  dustSystem = new THREE.Points(geometry, material);
  dustSystem.frustumCulled = false;
  dustSystem.renderOrder = 999; // In front of stars, behind text/cursor
  scene.add(dustSystem);
}

export function updateDust() {
  if (!dustSystem) return;
  dustSystem.material.uniforms.time.value += 0.014;
}