import * as THREE from 'three';

const particleMaterial = new THREE.PointsMaterial({
  size: 3.8,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.92,
  blending: THREE.AdditiveBlending,
  vertexColors: true
});

let particles, positionAttribute, homePositions, velocities = new Float32Array();
const mouse = new THREE.Vector2();
let isMouseOver = false;
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const mouse3D = new THREE.Vector3();

export function setupMouse(renderer) {
  renderer.domElement.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  renderer.domElement.addEventListener('mouseenter', () => isMouseOver = true);
  renderer.domElement.addEventListener('mouseleave', () => isMouseOver = false);
}

export function createParticles(scene, text = "Josiah Clark") {
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

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const positions = [];
  const colors = [];
  const color = new THREE.Color();

  for (let y = 0; y < canvas.height; y += 3) {
    for (let x = 0; x < canvas.width; x += 3) {
      const i = (y * canvas.width + x) * 4;
      if (data[i + 3] > 128) {
        const px = (x / scale) - (canvas.width / scale / 2);
        const py = -(y / scale) + (canvas.height / scale / 2);

        // Moved way back and up
        positions.push(px, py + 180, (Math.random() - 0.5) * 100 - 450);

        const hue = 0.48 + 0.3 * (Math.random());
        color.setHSL(hue, 1.0, 0.6 + Math.random() * 0.3);
        colors.push(color.r, color.g, color.b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  if (particles) scene.remove(particles);
  particles = new THREE.Points(geometry, particleMaterial);
  scene.add(particles);
  window.particleTextPosition = new THREE.Vector3(0, 180, 350); // exact center of your text

  positionAttribute = geometry.getAttribute('position');
  homePositions = new Float32Array(positions);
  velocities = new Float32Array(positions.length);
}

export function updateParticles(camera) {
  if (!positionAttribute) return;

  const pos = positionAttribute.array;

  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouse3D);
  }

  const repulse = 65;
  const strength = 10;
  const spring = 0.025;
  const damp = 0.45;

  for (let i = 0; i < pos.length; i += 3) {
    let vx = velocities[i] || 0;
    let vy = velocities[i + 1] || 0;
    let vz = velocities[i + 2] || 0;

    vx += (homePositions[i] - pos[i]) * spring;
    vy += (homePositions[i + 1] - pos[i + 1]) * spring;
    vz += (homePositions[i + 2] - pos[i + 2]) * spring;

    if (isMouseOver && mouse3D) {
      const dx = pos[i] - mouse3D.x;
      const dy = pos[i + 1] - mouse3D.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < repulse * repulse && dSq > 1) {
        const dist = Math.sqrt(dSq);
        const force = strength * (1 - dist / repulse);
        vx += dx / dist * force;
        vy += dy / dist * force;
      }
    }

    vx *= damp; vy *= damp; vz *= damp;
    velocities[i] = vx; velocities[i + 1] = vy; velocities[i + 2] = vz;

    pos[i] += vx;
    pos[i + 1] += vy;
    pos[i + 2] += vz;
  }

  positionAttribute.needsUpdate = true;
}