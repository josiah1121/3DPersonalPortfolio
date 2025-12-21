// src/glowText.js — Repulsion now matches particles.js exactly (same constants, plane setup, and logic)
import * as THREE from 'three';
import { mouse, isMouseOver } from './cursor.js';

// Custom intense cyan glow particle texture
function generateGlowParticleTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0.0, 'rgba(0, 255, 255, 1)');
  gradient.addColorStop(0.1, 'rgba(0, 255, 255, 1)');
  gradient.addColorStop(0.3, 'rgba(0, 220, 255, 0.9)');
  gradient.addColorStop(0.6, 'rgba(0, 180, 255, 0.6)');
  gradient.addColorStop(1.0, 'rgba(0, 100, 200, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const glowParticleTexture = generateGlowParticleTexture();

const particleMaterial = new THREE.PointsMaterial({
  size: 5.5,
  sizeAttenuation: true,
  map: glowParticleTexture,
  transparent: true,
  opacity: 1.0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: false
});

let subtitleParticles = null;
let subtitlePositionAttribute = null;
let subtitleHomePositions = null;
let subtitleVelocities = new Float32Array();
const DISTANCE = -600; // Must match main particles exactly

// Positioning (kept your latest values)
const SUBTITLE_SCALE = 1.2;
const SUBTITLE_Y_OFFSET = -55;
const SUBTITLE_X_OFFSET = 150;
const SUBTITLE_Z_OFFSET = 300; // z = -500 (in front)

let isFormingSubtitle = false;
let subtitleFormationStartTime = 0;
const subtitleFormationDuration = 1000;

// Re-use the same raycaster and mouse3D as particles.js
const raycaster = new THREE.Raycaster();
const mouse3D = new THREE.Vector3();

export function createGlowText(scene) {
  const text = "Software Engineer";

  const canvas = document.createElement('canvas');
  const scale = 1.25;
  canvas.width = 1024 * scale;
  canvas.height = 512 * scale;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'white';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let fontSize = Math.floor(90 * scale * 11 / text.length);
  fontSize = Math.max(fontSize, 50 * scale);
  ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const tempPositions = [];

  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const i = (y * canvas.width + x) * 4;
      if (data[i + 3] > 128) {
        const px = (x / scale) - (canvas.width / scale / 2);
        const py = -(y / scale) + (canvas.height / scale / 2);
        tempPositions.push(px, py, 0);
      }
    }
  }

  const finalPositions = [];
  const groundY = 10;

  for (let i = 0; i < tempPositions.length; i += 3) {
    const x = tempPositions[i] * SUBTITLE_SCALE + SUBTITLE_X_OFFSET;
    const y = tempPositions[i + 1] * SUBTITLE_SCALE + groundY + SUBTITLE_Y_OFFSET;
    const z = -DISTANCE + SUBTITLE_Z_OFFSET;

    finalPositions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(finalPositions, 3).setUsage(THREE.DynamicDrawUsage));

  if (subtitleParticles) scene.remove(subtitleParticles);
  subtitleParticles = new THREE.Points(geometry, particleMaterial);
  scene.add(subtitleParticles);

  subtitlePositionAttribute = geometry.getAttribute('position');
  subtitleHomePositions = new Float32Array(finalPositions);

  // Scatter particles
  const pos = subtitlePositionAttribute.array;
  const scatterRadius = 600;

  for (let i = 0; i < pos.length; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = scatterRadius * Math.cbrt(Math.random());

    pos[i]     = r * Math.sin(phi) * Math.cos(theta) + SUBTITLE_X_OFFSET;
    pos[i + 1] = r * Math.sin(phi) * Math.sin(theta) + groundY + SUBTITLE_Y_OFFSET;
    pos[i + 2] = r * Math.cos(phi) - DISTANCE + SUBTITLE_Z_OFFSET;
  }
  subtitlePositionAttribute.needsUpdate = true;

  subtitleVelocities = new Float32Array(pos.length);
  isFormingSubtitle = true;
  subtitleFormationStartTime = performance.now();
}

export function updateGlowText(camera) {
  if (!subtitlePositionAttribute) return;

  const pos = subtitlePositionAttribute.array;

  // === EXACT SAME MOUSE 3D CALCULATION AS particles.js ===
  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    // Use the same plane distance as main text, but offset by SUBTITLE_Z_OFFSET
    const textPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), DISTANCE - SUBTITLE_Z_OFFSET);
    raycaster.ray.intersectPlane(textPlane, mouse3D);
  }

  // === EXACT SAME FORMATION LOGIC ===
  const elapsed = performance.now() - subtitleFormationStartTime;
  const progress = Math.min(elapsed / subtitleFormationDuration, 1);
  const baseSpring = 0.025;
  const spring = isFormingSubtitle
    ? baseSpring + 0.12 * (1 - progress)
    : baseSpring;

  if (isFormingSubtitle && progress >= 1) {
    isFormingSubtitle = false;
  }

  // === EXACT SAME REPULSION CONSTANTS AS particles.js ===
  const repulse = 65;     // ← matches main text
  const strength = 10;    // ← matches main text
  const damp = 0.45;      // ← matches main text

  for (let i = 0; i < pos.length; i += 3) {
    let vx = subtitleVelocities[i] || 0;
    let vy = subtitleVelocities[i + 1] || 0;
    let vz = subtitleVelocities[i + 2] || 0;

    // Spring to home
    vx += (subtitleHomePositions[i] - pos[i]) * spring;
    vy += (subtitleHomePositions[i + 1] - pos[i + 1]) * spring;
    vz += (subtitleHomePositions[i + 2] - pos[i + 2]) * spring;

    // === IDENTICAL REPULSION LOGIC ===
    if (!isFormingSubtitle || progress > 0.7) {
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

    // Damping
    vx *= damp;
    vy *= damp;
    vz *= damp;

    subtitleVelocities[i] = vx;
    subtitleVelocities[i + 1] = vy;
    subtitleVelocities[i + 2] = vz;

    pos[i] += vx;
    pos[i + 1] += vy;
    pos[i + 2] += vz;
  }

  subtitlePositionAttribute.needsUpdate = true;
}