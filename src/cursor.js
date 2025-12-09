// src/cursor.js
import * as THREE from 'three';

let mouse = new THREE.Vector2();
let prevMouse = new THREE.Vector2();
let mouseVelocity = 0;
let isVisible = false;
let trailParticles = [];

export function setupCursor(scene, camera, renderer) {
  const dom = renderer.domElement;
  dom.style.cursor = 'none';

  console.log('Minimal light cursor ready (will appear after text forms)');

  // --- Tiny pure light orb (no visible geometry) ---
  // We use a small plane with additive blending + glow sprite for a clean "point of light" look
  const spriteTexture = new THREE.TextureLoader().load(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAoQe5wwAAAABJRU5ErkJggg==' // tiny white dot (or you can use a real glow sprite)
  );

  const cursorMaterial = new THREE.SpriteMaterial({
    map: spriteTexture,
    color: 0xffffff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const cursorOrb = new THREE.Sprite(cursorMaterial);
  cursorOrb.scale.set(12, 12, 1);  // small bright core

  // Soft warm glow layer
  const glowMaterial = new THREE.SpriteMaterial({
    map: spriteTexture,
    color: 0xffddaa,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.25
  });

  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(60, 60, 1);  // larger soft halo

  const cursorGroup = new THREE.Group();
  cursorGroup.add(cursorOrb);
  cursorGroup.add(glow);

  cursorGroup.visible = false;  // hidden until text forms
  scene.add(cursorGroup);

  // --- Subtle burning dust trail (unchanged) ---
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

  // Mouse tracking
  dom.addEventListener('mousemove', (e) => {
    prevMouse.copy(mouse);
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  function activate() {
    if (isVisible) return;
    isVisible = true;
    cursorGroup.visible = true;
    trail.visible = true;
    console.log('Minimal light cursor activated ✨');
  }

  function update() {
    if (!isVisible) return;

    const dx = mouse.x - prevMouse.x;
    const dy = mouse.y - prevMouse.y;
    mouseVelocity = Math.hypot(dx, dy);

    // Position on fixed plane in front of text
    const targetZ = -100;
    const vector = new THREE.Vector3(mouse.x, mouse.y, 0.8);
    vector.unproject(camera);
    const dir = vector.sub(camera.position).normalize();
    const distance = (targetZ - camera.position.z) / dir.z;
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));

    cursorGroup.position.copy(pos);

    // Emit subtle trail
    if (mouseVelocity > 0.001) {
      const count = Math.min(Math.floor(mouseVelocity * 300), 12);
      for (let i = 0; i < count; i++) {
        if (trailParticles.length >= trailCount) break;
        trailParticles.push({
          pos: pos.clone().add(new THREE.Vector3(
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

    // Update trail particles (unchanged)
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