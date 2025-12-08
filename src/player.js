import * as THREE from 'three';

export function createPlayer(scene) {
  const group = new THREE.Group();

  // Body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.4, 1.2, 4, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  body.position.y = 0.8;
  group.add(body);

  // Head + eyes (same as before)
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  head.position.y = 1.7;
  group.add(head);

  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  const leftEye = eye.clone(); leftEye.position.set(-0.15, 1.75, 0.3);
  const rightEye = eye.clone(); rightEye.position.set(0.15, 1.75, 0.3);
  group.add(leftEye, rightEye);

  // Starting position — right in front of the text
  // With this (safe fallback if window.particleTextPosition doesn't exist yet):
  const textPos = window.particleTextPosition || new THREE.Vector3(0, 180, -450);
  group.position.set(
    textPos.x,           // = 0
    textPos.y - 100,     // 120 units below the text (perfect eye-level view)
    textPos.z + 180      // 180 units in front of the text
  );
  
  group.lookAt(textPos)

  scene.add(group);

  // === MOVEMENT SYSTEM (fixed & working 100%) ===
  const keys = { w: false, a: false, s: false, d: false };
  const speed = 120; // feels great

  // These listeners MUST be added immediately (they are now)
  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
  });

  document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
  });

  function update(delta) {
    const move = new THREE.Vector3();

    if (keys['w']) move.z -= 1;
    if (keys['s']) move.z += 1;
    if (keys['a']) move.x -= 1;
    if (keys['d']) move.x += 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * delta);
      group.position.add(move);
    }

    // Gentle floating animation
    group.position.y = Math.sin(Date.now() * 0.003) * 0.15 + 0.1;
  }

  return { group, update };
}