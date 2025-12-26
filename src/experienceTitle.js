// src/experienceTitle.js
// "Experience" particle title – faces camera directly (billboard style), softer purple glow

import * as THREE from 'three';
import { mouse, isMouseOver } from './cursor.js';

// Softer purple-magenta glow texture
function generateExperienceParticleTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0.0, 'rgba(200, 100, 255, 1)');
  gradient.addColorStop(0.15, 'rgba(180, 80, 255, 0.95)');
  gradient.addColorStop(0.4, 'rgba(140, 60, 220, 0.7)');
  gradient.addColorStop(0.7, 'rgba(100, 40, 180, 0.4)');
  gradient.addColorStop(1.0, 'rgba(80, 20, 140, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const particleTexture = generateExperienceParticleTexture();

const particleMaterial = new THREE.PointsMaterial({
  size: 5.2,
  sizeAttenuation: true,
  map: particleTexture,
  transparent: true,
  opacity: 0.85,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexColors: false
});

let titleParticles = null;
let titlePositionAttribute = null;
let titleHomePositions = null;
let titleVelocities = new Float32Array();

const DISTANCE = -600; // matches main text plane

// Positioning: above the experience timeline, facing camera
const TITLE_SCALE = 1.5;
const TITLE_Y_OFFSET = 1080;    // high enough above timeline
const TITLE_X_OFFSET = 50;
const TITLE_Z_OFFSET = -4000;    // same as subtitle, forward from main text

let isFormingTitle = false;
let titleFormationStartTime = 0;
const titleFormationDuration = 1200;

const raycaster = new THREE.Raycaster();
const mouse3D = new THREE.Vector3();

export function createExperienceTitle(scene) {
  const text = "Experience";

  const canvas = document.createElement('canvas');
  const scale = 1.3;
  canvas.width = 1024 * scale;
  canvas.height = 512 * scale;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';

  let fontSize = Math.floor(110 * scale * 11 / text.length);
  fontSize = Math.max(fontSize, 60 * scale);
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

  for (let i = 0; i < tempPositions.length; i += 3) {
    const x = tempPositions[i] * TITLE_SCALE + TITLE_X_OFFSET;
    const y = tempPositions[i + 1] * TITLE_SCALE + TITLE_Y_OFFSET;
    const z = -DISTANCE + TITLE_Z_OFFSET; // same plane depth logic

    finalPositions.push(x, y, z);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(finalPositions, 3).setUsage(THREE.DynamicDrawUsage));

  if (titleParticles) scene.remove(titleParticles);

  titleParticles = new THREE.Points(geometry, particleMaterial.clone()); // clone to allow independent opacity later

  // NO rotation.x = -PI/2 → this keeps it facing the camera!
  scene.add(titleParticles);

  titlePositionAttribute = geometry.getAttribute('position');
  titleHomePositions = new Float32Array(finalPositions);

  // Initial scatter
  const pos = titlePositionAttribute.array;
  const scatterRadius = 700;

  for (let i = 0; i < pos.length; i += 3) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = scatterRadius * Math.cbrt(Math.random());

    pos[i]     = r * Math.sin(phi) * Math.cos(theta) + TITLE_X_OFFSET;
    pos[i + 1] = r * Math.sin(phi) * Math.sin(theta) + TITLE_Y_OFFSET;
    pos[i + 2] = r * Math.cos(phi) - DISTANCE + TITLE_Z_OFFSET;
  }
  titlePositionAttribute.needsUpdate = true;

  titleVelocities = new Float32Array(pos.length);
  isFormingTitle = true;
  titleFormationStartTime = performance.now();

  return titleParticles; // return the points object for dimming if needed
}

export function updateExperienceTitle(camera) {
  if (!titlePositionAttribute) return;

  const pos = titlePositionAttribute.array;

  // Mouse projection onto the same virtual plane
  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    const textPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), DISTANCE - TITLE_Z_OFFSET);
    raycaster.ray.intersectPlane(textPlane, mouse3D);
  }

  const elapsed = performance.now() - titleFormationStartTime;
  const progress = Math.min(elapsed / titleFormationDuration, 1);
  const baseSpring = 0.025;
  const spring = isFormingTitle ? baseSpring + 0.12 * (1 - progress) : baseSpring;

  if (isFormingTitle && progress >= 1) {
    isFormingTitle = false;
  }

  const repulse = 65;
  const strength = 10;
  const damp = 0.45;

  for (let i = 0; i < pos.length; i += 3) {
    let vx = titleVelocities[i] || 0;
    let vy = titleVelocities[i + 1] || 0;
    let vz = titleVelocities[i + 2] || 0;

    // Spring to home
    vx += (titleHomePositions[i] - pos[i]) * spring;
    vy += (titleHomePositions[i + 1] - pos[i + 1]) * spring;
    vz += (titleHomePositions[i + 2] - pos[i + 2]) * spring;

    // Mouse repulsion
    if (!isFormingTitle || progress > 0.7) {
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

    titleVelocities[i] = vx;
    titleVelocities[i + 1] = vy;
    titleVelocities[i + 2] = vz;

    pos[i] += vx;
    pos[i + 1] += vy;
    pos[i + 2] += vz;
  }

  titlePositionAttribute.needsUpdate = true;

  // Optional: make it always face camera (true billboard) – but not needed since points are spherical
  // titleParticles.lookAt(camera.position);
}