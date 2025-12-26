import * as THREE from 'three';

export const mouse = new THREE.Vector2();
export let isMouseOver = false;
let prevMouse = new THREE.Vector2();
let mouseVelocity = 0;
let isVisible = false;
let trailParticles = [];

// Re-usable vector for calculations
const targetPos = new THREE.Vector3();

export function setupCursor(scene, camera, renderer) {
  const dom = renderer.domElement;

  // 'none' on desktop, auto on mobile to allow interaction
  dom.style.cursor = 'none';
  dom.style.touchAction = 'none'; // Prevents default browser panning/zooming

  const spriteTexture = new THREE.TextureLoader().load(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGAoQe5wwAAAABJRU5ErkJggg=='
  );

  const cursorMaterial = new THREE.SpriteMaterial({
    map: spriteTexture,
    color: 0x00ffff, 
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false 
  });

  const glowMaterial = new THREE.SpriteMaterial({
    map: spriteTexture,
    color: 0x4488ff,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.35,
    depthTest: false 
  });

  const trailCount = 800;
  const trailGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(trailCount * 3).fill(0);
  const sizes = new Float32Array(trailCount).fill(0);
  const alphas = new Float32Array(trailCount).fill(0);

  trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  trailGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  trailGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

  const trailMaterial = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(0x88ccff) } },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      void main() {
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (400.0 / -mvPosition.z);
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
    depthTest: false,
    transparent: true
  });

  const trail = new THREE.Points(trailGeometry, trailMaterial);
  trail.visible = false;
  trail.frustumCulled = false; 
  scene.add(trail);

  const cursorOrb = new THREE.Sprite(cursorMaterial);
  cursorOrb.scale.set(22, 22, 1);

  const glow = new THREE.Sprite(glowMaterial);
  glow.scale.set(100, 100, 1);

  const cursorGroup = new THREE.Group();
  cursorGroup.add(cursorOrb);
  cursorGroup.add(glow);
  cursorGroup.visible = false;
  cursorGroup.frustumCulled = false; 
  scene.add(cursorGroup);

  cursorGroup.renderOrder = 9999;
  trail.renderOrder = 9998;

  // --- UNIFIED POINTER HANDLING ---
  // Using pointer events covers Mouse, Touch, and Stylus in one listener
  const updatePointer = (clientX, clientY) => {
    prevMouse.copy(mouse);
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    isMouseOver = true;
    if (!isVisible) activate();
  };

  dom.addEventListener('pointermove', (e) => {
    updatePointer(e.clientX, e.clientY);
  });

  dom.addEventListener('pointerdown', (e) => {
    updatePointer(e.clientX, e.clientY);
  });

  dom.addEventListener('pointerleave', () => {
    isMouseOver = false;
  });

  function activate() {
    isVisible = true;
    cursorGroup.visible = true;
    trail.visible = true;
  }

  function update() {
    if (!isVisible) return;
    
    const dx = mouse.x - prevMouse.x;
    const dy = mouse.y - prevMouse.y;
    mouseVelocity = Math.hypot(dx, dy);

    const currentZ = window.isStarted ? -800 : -500;
    
    // OFFSET FOR TOUCH: On mobile, move the orb slightly above the finger so it's visible
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const yOffset = isTouch ? 0.08 : 0; 

    targetPos.set(mouse.x, mouse.y + yOffset, 0.5);
    targetPos.unproject(camera);
    targetPos.sub(camera.position).normalize();
    
    const distance = (currentZ - camera.position.z) / targetPos.z;
    cursorGroup.position.copy(camera.position).add(targetPos.multiplyScalar(distance));

    if (mouseVelocity > 0.001) {
      const count = Math.min(Math.floor(mouseVelocity * 300), 12);
      for (let i = 0; i < count; i++) {
        if (trailParticles.length >= trailCount) break;
        trailParticles.push({
          pos: cursorGroup.position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
          )),
          life: 1.0,
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 60,
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
        posArray[idx * 3] = p.pos.x;
        posArray[idx * 3 + 1] = p.pos.y;
        posArray[idx * 3 + 2] = p.pos.z;
        sizeArray[idx] = p.life * (15 + Math.random() * 20);
        alphaArray[idx] = p.life * 0.7;
        idx++;
      }
    }
    while (trailParticles.length && trailParticles[0].life <= 0) trailParticles.shift();
    
    trailGeometry.attributes.position.needsUpdate = true;
    trailGeometry.attributes.size.needsUpdate = true;
    trailGeometry.attributes.alpha.needsUpdate = true;
  }

  return { update, activate, cursorGroup };
}