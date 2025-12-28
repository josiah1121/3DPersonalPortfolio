import * as THREE from 'three';
import { mouse, isMouseOver } from './cursor.js';

function generateParticleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 250, 200, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.4)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
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

// SPEED: Faster spawn interval
const particleSpawnInterval = 0.0003; 
const maxParticles = 15000; 
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
      gl_PointSize = size * (500.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D pointTexture;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      vec4 texColor = texture2D(pointTexture, gl_PointCoord);
      gl_FragColor = vec4(vColor * vAlpha * 1.4, vAlpha) * texColor;
    }
  `,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true
});

export function createSkillsTitle(scene, skillsGroup) {
  titleGroup = new THREE.Group();
  titleGroup.position.set(-900 + 30, 60, -800 + 250); 
  titleGroup.rotation.x = -Math.PI / 2;
  scene.add(titleGroup);

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
  const scale = 1.8;

  const letterBounds = [
    { x: 80,  w: 200 }, { x: 260, w: 180 }, { x: 440, w: 90 },
    { x: 530, w: 110 }, { x: 640, w: 110 }, { x: 750, w: 200 }
  ];

  letterParticles = letterBounds.map(bound => {
    const particles = [];
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = bound.x; x < bound.x + bound.w; x += 2) {
        if (x >= canvas.width) continue;
        const i = (y * canvas.width + x) * 4;
        if (imageData[i + 3] > 128) {
          const px = (x - canvas.width / 2) * scale;
          const pz = -(y - canvas.height / 2) * scale;
          particles.push(new THREE.Vector3(px, 0, pz));
        }
      }
    }
    return particles;
  });

  allParticles = letterParticles.flat();
  velocities = new Float32Array(allParticles.length * 3).fill(0);

  const geometry = new THREE.BufferGeometry();
  const count = allParticles.length;
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute('customColor', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  titleGroup.add(points);

  titleGroup.userData = { positions: geometry.attributes.position.array, sizes: geometry.attributes.size.array, alphas: geometry.attributes.alpha.array, colors: geometry.attributes.customColor.array, geometry, allParticles };
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

  // Faster Spawning Logic
  timeSinceLastParticle += delta;
  const particlesToSpawn = Math.floor(timeSinceLastParticle / particleSpawnInterval);
  for(let p = 0; p < particlesToSpawn; p++) {
    if (currentLetterIndex < letterParticles.length) {
      const currentLetter = letterParticles[currentLetterIndex];
      if (particleIndexInLetter < currentLetter.length) {
        const targetPos = currentLetter[particleIndexInLetter];
        const index = allParticles.indexOf(targetPos);
        if (index !== -1) {
          ud.positions[index * 3]     = targetPos.x + (Math.random() - 0.5) * 100;
          ud.positions[index * 3 + 1] = targetPos.y + 40;
          ud.positions[index * 3 + 2] = targetPos.z + (Math.random() - 0.5) * 100;
        }
        particleIndexInLetter++;
      } else {
        currentLetterIndex++;
        particleIndexInLetter = 0;
      }
    }
  }
  timeSinceLastParticle %= particleSpawnInterval;

  if (currentLetterIndex >= letterParticles.length && !isComplete) isComplete = true;

  const totalDrawn = isComplete ? allParticles.length : letterParticles.slice(0, currentLetterIndex).reduce((a, b) => a + b.length, 0) + particleIndexInLetter;
  
  const repulseDist = 60; 
  const strength = 35;

  for (let i = 0; i < allParticles.length; i++) {
    if (i < totalDrawn) {
      const target = allParticles[i];
      const i3 = i * 3;
      let vx = velocities[i3], vy = velocities[i3 + 1], vz = velocities[i3 + 2];

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
          const push = force / dist * 1.5;
          vx += dx * push;
          vy += dy * push;
          vz += dz * push;
        }
      }

      if (!isRepelled) {
        vx += (target.x - ud.positions[i3]) * 0.05;
        vy += (target.y - ud.positions[i3 + 1]) * 0.05;
        vz += (target.z - ud.positions[i3 + 2]) * 0.05;
      }

      vx *= 0.85; vy *= 0.85; vz *= 0.85;
      velocities[i3] = vx; velocities[i3 + 1] = vy; velocities[i3 + 2] = vz;
      ud.positions[i3] += vx; ud.positions[i3 + 1] += vy; ud.positions[i3 + 2] += vz;

      const pulse = isComplete ? 0.95 + Math.sin(time * 3.0 + i * 0.05) * 0.05 : 1.0;
      ud.sizes[i] = (isComplete ? 18 : 22) * pulse;
      ud.alphas[i] = isComplete ? 0.95 : 1.0;

      const color = new THREE.Color().setHSL(0.08, 1.0, isComplete ? 0.85 : 0.9);
      ud.colors[i3] = color.r; ud.colors[i3+1] = color.g; ud.colors[i3+2] = color.b;
    }
  }

  ud.geometry.attributes.position.needsUpdate = true;
  ud.geometry.attributes.size.needsUpdate = true;
  ud.geometry.attributes.alpha.needsUpdate = true;
  ud.geometry.attributes.customColor.needsUpdate = true;
}