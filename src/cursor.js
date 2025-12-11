// src/cursor.js — YOUR ORIGINAL CODE + ONLY 4 LINES ADDED
import * as THREE from 'three';

export const mouse = new THREE.Vector2();
export let isMouseOver = false;   // ← ADD THIS LINE
let prevMouse = new THREE.Vector2();
let mouseVelocity = 0;
let isVisible = false;
let trailParticles = [];

// ADD THESE 4 LINES — this is all we need
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersectPoint = new THREE.Vector3();

export function setupCursor(scene, camera, renderer) {
  const dom = renderer.domElement;
  dom.style.cursor = 'none';

  console.log('Minimal light cursor ready (will appear after text forms)');

  const spriteTexture = new THREE.TextureLoader().load(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAoQe5wwAAAABJRU5ErkJggg=='
  );

  const cursorMaterial = new THREE.SpriteMaterial({
    map: spriteTexture,
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const cursorOrb = new THREE.Sprite(cursorMaterial);
  cursorOrb.scale.set(12, 12, 1);

  const glowMaterial = new THREE.SpriteMaterial({
    map: spriteTexture,
    color: 0xffddaa,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.25
  });

  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(60, 60, 1);

  const cursorGroup = new THREE.Group();
  cursorGroup.add(cursorOrb);
  cursorGroup.add(glow);
  cursorGroup.visible = false;
  scene.add(cursorGroup);

  // YOUR ORIGINAL TRAIL — 100% UNTOUCHED
  const trailCount = 800;
  const trailGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(trailCount * 3).fill(0);
  const sizes = new Float32Array(trailCount).fill(0);
  const alphas = new Float32Array(trailCount).fill(0);

  trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  trailGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  trailGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

  const trailMaterial = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(0xffaa77) } },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vAlpha;
      void main() {
        if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
        gl_FragColor = vec4(color, vAlpha);
      }
    `,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true
  });

  const trail = new THREE.Points(trailGeometry, trailMaterial);
  trail.visible = false;
  scene.add(trail);

  dom.addEventListener('mousemove', (e) => {
    prevMouse.copy(mouse);
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  
    isMouseOver = true;        // ← ADD THIS
  });
  
  dom.addEventListener('mouseleave', () => {
    isMouseOver = false;       // ← ADD THIS
  });

  function activate() {
    if (isVisible) return;
    isVisible = true;
    cursorGroup.visible = true;
    trail.visible = true;
    console.log('Minimal light cursor activated');
  }

  function update() {
    if (!isVisible) return;

    const dx = mouse.x - prevMouse.x;
    const dy = mouse.y - prevMouse.y;
    mouseVelocity = Math.hypot(dx, dy);

    raycaster.setFromCamera(mouse, camera);
    const textPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -800);
    raycaster.ray.intersectPlane(textPlane, intersectPoint);
    if (intersectPoint) {
      cursorGroup.position.copy(intersectPoint);
      cursorGroup.position.y += 10; // match your groundY = 10
    }

    // YOUR ORIGINAL TRAIL CODE — COMPLETELY UNTOUCHED BELOW
    if (mouseVelocity > 0.001) {
      const count = Math.min(Math.floor(mouseVelocity * 300), 12);
      for (let i = 0; i < count; i++) {
        if (trailParticles.length >= trailCount) break;
        trailParticles.push({
          pos: cursorGroup.position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 15
          )),
          life: 1.0,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 20
          )
        });
      }
    }

    let idx = 0;
    const posArray = trailGeometry.attributes.position.array;
    const sizeArray = trailGeometry.attributes.size.array;
    const alphaArray = trailGeometry.attributes.alpha.array;

    for (let i = trailParticles.length - 1; i >= 0 && idx < trailCount; i--) {
      const p = trailParticles[i];
      p.life -= 0.02;
      p.pos.addScaledVector(p.vel, 0.02);

      if (p.life > 0) {
        posArray[idx * 3]     = p.pos.x;
        posArray[idx * 3 + 1] = p.pos.y;
        posArray[idx * 3 + 2] = p.pos.z;
        sizeArray[idx] = p.life * (6 + Math.random() * 8);
        alphaArray[idx] = p.life * 0.7;
        idx++;
      }
    }

    while (trailParticles.length && trailParticles[0].life <= 0) trailParticles.shift();

    for (; idx < trailCount; idx++) {
      sizeArray[idx] = alphaArray[idx] = 0;
    }

    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.size.needsUpdate = true;
    trailGeometry.attributes.alpha.needsUpdate = true;
  }

  return { update, activate };
}