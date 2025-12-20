import * as THREE from 'three';
import { mouse, isMouseOver } from './cursor.js';

function generateParticleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.15, 'rgba(255, 240, 180, 1)');
  gradient.addColorStop(0.4, 'rgba(255, 160, 80, 0.9)');
  gradient.addColorStop(0.7, 'rgba(255, 80, 40, 0.5)');
  gradient.addColorStop(1.0, 'rgba(200, 30, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const particleTexture = generateParticleTexture();

let titleGroup = null;
let letterParticles = [];
let allParticles = [];
let velocities = null;
let currentLetterIndex = -1;
let particleIndexInLetter = 0;
let timeSinceLastParticle = 0;
let isComplete = false;

const particleSpawnInterval = 0.0008;
const maxParticles = 10000;
const raycaster = new THREE.Raycaster();
const mouse3D = new THREE.Vector3();
let titlePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

const material = new THREE.ShaderMaterial({
  uniforms: { pointTexture: { value: particleTexture } },
  vertexShader: `
    attribute float size;
    attribute float alpha;
    attribute vec3 customColor;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      vAlpha = alpha;
      vColor = customColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D pointTexture;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      vec4 texColor = texture2D(pointTexture, gl_PointCoord);
      gl_FragColor = vec4(vColor * vAlpha, vAlpha) * texColor;
    }
  `,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true
});

// Now takes scene AND skillsGroup (to calculate correct world position)
export function createSkillsTitle(scene, skillsGroup) {
  titleGroup = new THREE.Group();

  // Calculate the world position where the title should be
  // skillsGroup is at (-1100, 100, -800)
  // Original offset was +80 x, +10 y (but adjusted), +180 z
  // Final world position: (-1100 + 80, 100 - 100 + 10?, -800 + 180)
  titleGroup.position.set(-1100 + 30, 50, -800 + 180); // ≈ (-1020, 0, -620)
  titleGroup.rotation.x = -Math.PI / 2;

  // ADD TO SCENE, NOT skillsGroup → completely independent of rotation
  scene.add(titleGroup);

  // Update plane for mouse interaction
  const worldPos = new THREE.Vector3();
  titleGroup.getWorldPosition(worldPos);
  titlePlane.set(new THREE.Vector3(0, 0, 1), -worldPos.z);

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.font = 'bold 140px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Skills', canvas.width / 2, canvas.height / 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const scale = 1.9;

  const letterBounds = [
    { x: 80,  w: 200 }, { x: 260, w: 180 }, { x: 440, w: 90 },
    { x: 530, w: 110 }, { x: 640, w: 110 }, { x: 750, w: 200 }
  ];

  letterParticles = letterBounds.map(bound => {
    const particles = [];
    for (let y = 0; y < canvas.height; y += 4) {
      for (let x = bound.x; x < bound.x + bound.w; x += 4) {
        if (x >= canvas.width) continue;
        const i = (y * canvas.width + x) * 4;
        if (imageData[i + 3] > 128) {
          const px = (x - canvas.width / 2) * scale;
          const pz = -(y - canvas.height / 2) * scale;
          particles.push(new THREE.Vector3(px, 0, pz));
        }
      }
    }
    particles.sort((a, b) => a.z - b.z || a.x - b.x);
    return particles;
  });

  allParticles = letterParticles.flat();
  velocities = new Float32Array(allParticles.length * 3).fill(0);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(maxParticles * 3);
  const sizes = new Float32Array(maxParticles);
  const alphas = new Float32Array(maxParticles);
  const colors = new Float32Array(maxParticles * 3);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  titleGroup.add(points);

  titleGroup.userData = { positions, sizes, alphas, colors, geometry, allParticles };
  currentLetterIndex = 0;
  particleIndexInLetter = 0;

  return titleGroup;
}

export function updateSkillsTitle(camera, delta) {
  if (!titleGroup) return;

  const ud = titleGroup.userData;
  const time = performance.now() * 0.001;

  let hasValidMouse = false;
  let localMouse = new THREE.Vector3();

  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(titlePlane, mouse3D)) {
      hasValidMouse = true;
      localMouse.copy(mouse3D);
      titleGroup.worldToLocal(localMouse);
    }
  }

  timeSinceLastParticle += delta;

  while (timeSinceLastParticle >= particleSpawnInterval && currentLetterIndex < letterParticles.length) {
    const currentLetter = letterParticles[currentLetterIndex];
    if (particleIndexInLetter < currentLetter.length) {
      const targetPos = currentLetter[particleIndexInLetter];
      const index = allParticles.indexOf(targetPos);
      if (index !== -1) {
        ud.positions[index * 3]     = targetPos.x + (Math.random() - 0.5) * 140;
        ud.positions[index * 3 + 1] = targetPos.y + 50 + Math.random() * 60;
        ud.positions[index * 3 + 2] = targetPos.z + (Math.random() - 0.5) * 140;
      }
      particleIndexInLetter++;
      timeSinceLastParticle -= particleSpawnInterval;
    } else {
      currentLetterIndex++;
      particleIndexInLetter = 0;
    }
  }

  if (currentLetterIndex >= letterParticles.length && !isComplete) isComplete = true;

  const totalDrawn = letterParticles.slice(0, currentLetterIndex).reduce((a, b) => a + b.length, 0) + particleIndexInLetter;
  const baseSpring = 0.04;
  const damp = 0.82;
  const repulseDist = 50;
  const strength = 28;

  for (let i = 0; i < allParticles.length; i++) {
    if (i < totalDrawn || isComplete) {
      const target = allParticles[i];
      const i3 = i * 3;

      let vx = velocities[i3];
      let vy = velocities[i3 + 1];
      let vz = velocities[i3 + 2];

      let isRepelled = false;

      if (hasValidMouse) {
        const dx = ud.positions[i3] - localMouse.x;
        const dy = ud.positions[i3 + 1] - localMouse.y;
        const dz = ud.positions[i3 + 2] - localMouse.z;
        const distSq = dx*dx + dy*dy + dz*dz;

        if (distSq < repulseDist * repulseDist && distSq > 1) {
          isRepelled = true;
          const dist = Math.sqrt(distSq);
          const force = strength * (1 - dist / repulseDist);
          const push = force / dist * 1.3;

          vx += dx * push;
          vy += dy * push;
          vz += dz * push;
        }
      }

      if (!isRepelled) {
        vx += (target.x - ud.positions[i3]) * baseSpring;
        vy += (target.y - ud.positions[i3 + 1]) * baseSpring;
        vz += (target.z - ud.positions[i3 + 2]) * baseSpring;
      }

      vx *= damp;
      vy *= damp;
      vz *= damp;

      velocities[i3] = vx;
      velocities[i3 + 1] = vy;
      velocities[i3 + 2] = vz;

      ud.positions[i3] += vx;
      ud.positions[i3 + 1] += vy;
      ud.positions[i3 + 2] += vz;

      const pulse = isComplete ? 0.94 + Math.sin(time * 4.5 + i * 0.13) * 0.06 : 0.9;
      ud.sizes[i] = (isComplete ? 24 : 35) * pulse;
      ud.alphas[i] = isComplete ? 0.95 : 1.0;

      const color = new THREE.Color().setHSL(0.06, 1.0, isComplete ? 0.75 : 0.85);
      ud.colors[i3] = color.r;
      ud.colors[i3 + 1] = color.g;
      ud.colors[i3 + 2] = color.b;
    }
  }

  ud.geometry.attributes.position.needsUpdate = true;
  ud.geometry.attributes.size.needsUpdate = true;
  ud.geometry.attributes.alpha.needsUpdate = true;
  ud.geometry.attributes.customColor.needsUpdate = true;
}