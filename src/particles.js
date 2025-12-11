// particles.js
import * as THREE from 'three';
import { mouse, isMouseOver } from './cursor.js'; // ← this is the key!

// Helper function to generate a sharp circular particle texture
function generateParticleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(200,200,255,0.8)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return canvas;
}

const particleTexture = new THREE.CanvasTexture(generateParticleTexture());

const particleMaterial = new THREE.PointsMaterial({
  size: 5.0,
  sizeAttenuation: true,
  map: particleTexture,
  transparent: true,
  opacity: 1.0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: true
});

let particles = null;
let positionAttribute = null;
let homePositions = null;
let velocities = new Float32Array();
let DISTANCE = -800;

// === Formation animation state ===
let isForming = false;
let formationStartTime = 0;
const formationDuration = 750; // ms – adjust for faster/slower reveal
let onFormationComplete = null; // optional callback

const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouse3D = new THREE.Vector3();

// Updated signature: optional options object with onComplete callback
export function createParticles(scene, text = "Josiah Clark", options = {}) {
  onFormationComplete = options.onComplete || null;

  const canvas = document.createElement('canvas');
  const scale = 1.25;
  canvas.width = 1024 * scale;
  canvas.height = 512 * scale;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let fontSize = Math.floor(180 * scale * 11 / text.length);
  fontSize = Math.max(fontSize, 72 * scale);
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const tempPositions = [];
  const colors = [];
  const color = new THREE.Color();

  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < canvas.width; x += 3) {
      const i = (y * canvas.width + x) * 4;
      if (data[i + 3] > 128) {
        const px = (x / scale) - (canvas.width / scale / 2);
        const py = -(y / scale) + (canvas.height / scale / 2);

        tempPositions.push(px, py, 0);

        const hue = 0.48 + 0.3 * Math.random();
        color.setHSL(hue, 1.0, 0.6 + Math.random() * 0.3);
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  // Hollywood-sign transformation
  const finalPositions = [];
  const groundY = 10;           // matches your ground plane
  const TEXT_SCALE = 2.0;        // makes it big and readable

  for (let i = 0; i < tempPositions.length; i += 3) {
    const x = tempPositions[i]     * TEXT_SCALE;
    const y = tempPositions[i + 1] * TEXT_SCALE + groundY;
    const z = -DISTANCE;   // negative Z = away from camera

    finalPositions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(finalPositions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(finalPositions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.computeBoundingBox();

  if (particles) scene.remove(particles);
  particles = new THREE.Points(geometry, particleMaterial);
  scene.add(particles);

  window.particleTextPosition = new THREE.Vector3(0, groundY, - 50, -DISTANCE);
  window.particleTextCenter    = new THREE.Vector3(0, groundY + 100, -DISTANCE);

  positionAttribute = geometry.getAttribute('position');
  homePositions = new Float32Array(finalPositions);

  // === Scatter particles for the formation animation ===
  const pos = positionAttribute.array;
  const scatterRadius = 800;

  for (let i = 0; i < pos.length; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = scatterRadius * Math.cbrt(Math.random());

    pos[i]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i + 1] = r * Math.sin(phi) * Math.sin(theta) + groundY;
    pos[i + 2] = r * Math.cos(phi) - DISTANCE;
  }
  positionAttribute.needsUpdate = true;

  // Reset velocities and start formation
  velocities = new Float32Array(pos.length);
  isForming = true;
  formationStartTime = performance.now();
}

export function updateParticles(camera) {
  if (!positionAttribute) return;

  const pos = positionAttribute.array;

  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    const textPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), DISTANCE);
    raycaster.ray.intersectPlane(textPlane, mouse3D);
  }

  // Dynamic spring strength during formation
  const elapsed = performance.now() - formationStartTime;
  const progress = Math.min(elapsed / formationDuration, 1);
  const baseSpring = 0.025;
  const spring = isForming
    ? baseSpring + 0.12 * (1 - progress) // strong pull at start, eases off
    : baseSpring;

  // Finish formation
  if (isForming && progress >= 1) {
    isForming = false;
    if (onFormationComplete) onFormationComplete();
  }

  const repulse = 65;
  const strength = 10;
  const damp = 0.45;

  for (let i = 0; i < pos.length; i += 3) {
    let vx = velocities[i] || 0;
    let vy = velocities[i + 1] || 0;
    let vz = velocities[i + 2] || 0;

    // Spring toward home position
    vx += (homePositions[i] - pos[i]) * spring;
    vy += (homePositions[i + 1] - pos[i + 1]) * spring;
    vz += (homePositions[i + 2] - pos[i + 2]) * spring;

    // Mouse repulsion — 3D accurate, feels perfect
    if (!isForming || progress > 0.7) {
      if (isMouseOver && mouse3D) {
        const dx = pos[i] - mouse3D.x;
        const dy = pos[i + 1] - mouse3D.y;
        const dz = pos[i + 2] - mouse3D.z;

        const dSq = dx*dx + dy*dy + dz*dz;

        if (dSq < repulse * repulse && dSq > 1) {
          const dist = Math.sqrt(dSq);
          const force = strength * (1 - dist / repulse);

          vx += (dx / dist) * force;
          vy += (dy / dist) * force;
          vz += (dz / dist) * force;
        }
      }
    }

    vx *= damp;
    vy *= damp;
    vz *= damp;

    velocities[i] = vx;
    velocities[i + 1] = vy;
    velocities[i + 2] = vz;

    pos[i] += vx;
    pos[i + 1] += vy;
    pos[i + 2] += vz;
  }

  positionAttribute.needsUpdate = true;
}

export default {
  createParticles,
  updateParticles
};