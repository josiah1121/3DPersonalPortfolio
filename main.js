import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000011);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 600;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.6;

const particleMaterial = new THREE.PointsMaterial({
  size: 3.8,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.92,
  blending: THREE.AdditiveBlending,
  vertexColors: true
});

let particles;
let positionAttribute;
let homePositions;
let velocities = new Float32Array();
let isMouseOver = false;

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouse3D = new THREE.Vector3();

renderer.domElement.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

renderer.domElement.addEventListener('mouseenter', () => { isMouseOver = true; });
renderer.domElement.addEventListener('mouseleave', () => { isMouseOver = false; });

function createParticlesFromText(text = "Josiah Clark") {
  const canvas = document.createElement('canvas');
  const scale = 4;
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

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const positions = [];
  const colors = [];
  const color = new THREE.Color();
  const sampleStep = 3;

  for (let y = 0; y < canvas.height; y += sampleStep) {
    for (let x = 0; x < canvas.width; x += sampleStep) {
      const i = (y * canvas.width + x) * 4;
      const alpha = imageData[i + 3];
      if (alpha > 128) {
        const posX = (x / scale) - (canvas.width / scale / 2);
        const posY = -(y / scale) + (canvas.height / scale / 2);
        const posZ = (Math.random() - 0.5) * 110;

        positions.push(posX, posY, posZ);

        const hue = 0.48 + 0.3 * (posZ / 110 + 0.5);
        color.setHSL(hue, 1.0, 0.6 + Math.random() * 0.3);
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  const positionsFloat = new Float32Array(positions);
  const colorsFloat = new Float32Array(colors);

  homePositions = new Float32Array(positionsFloat);
  velocities = new Float32Array(positions.length);

  const geometry = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positionsFloat, 3);
  posAttr.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', posAttr);
  geometry.setAttribute('color', new THREE.BufferAttribute(colorsFloat, 3));

  if (particles) scene.remove(particles);
  particles = new THREE.Points(geometry, particleMaterial);
  scene.add(particles);

  positionAttribute = geometry.getAttribute('position');
}

function updatePhysics() {
  if (!positionAttribute) return;

  const positions = positionAttribute.array;

  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouse3D);
  }

  const repulsionRadius = 65;
  const repulsionStrength = 10;
  const springStrength = 0.025;
  const damping = 0.45;

  for (let i = 0; i < positions.length; i += 3) {
    let px = positions[i];
    let py = positions[i + 1];
    let pz = positions[i + 2];

    let vx = velocities[i];
    let vy = velocities[i + 1];
    let vz = velocities[i + 2];

    // Spring force
    vx += (homePositions[i] - px) * springStrength;
    vy += (homePositions[i + 1] - py) * springStrength;
    vz += (homePositions[i + 2] - pz) * springStrength;

    // Mouse repulsion
    if (isMouseOver && mouse3D) {
      const dx = px - mouse3D.x;
      const dy = py - mouse3D.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < repulsionRadius * repulsionRadius && distSq > 1) {
        const dist = Math.sqrt(distSq);
        const force = repulsionStrength * (1 - dist / repulsionRadius);
        vx += (dx / dist) * force;
        vy += (dy / dist) * force;
      }
    }

    // Apply damping
    vx *= damping;
    vy *= damping;
    vz *= damping;

    velocities[i] = vx;
    velocities[i + 1] = vy;
    velocities[i + 2] = vz;

    positions[i] += vx;
    positions[i + 1] += vy;
    positions[i + 2] += vz;
  }

  positionAttribute.needsUpdate = true;
}

createParticlesFromText("Josiah Clark");

function animate() {
  requestAnimationFrame(animate);
  updatePhysics();
  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});