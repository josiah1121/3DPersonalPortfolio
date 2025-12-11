// src/stars.js — Enhanced: more shooting stars + fast dust streaks
import * as THREE from 'three';

const stars = [];
let scene, camera;

const starMaterial = new THREE.SpriteMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const trailMaterial = new THREE.LineBasicMaterial({
  color: 0xaaddff,
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const dustMaterial = new THREE.LineBasicMaterial({
  color: 0x88ccff,
  transparent: true,
  opacity: 0.25,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

export function initShootingStars(_scene, _camera) {
  scene = _scene;
  camera = _camera;

  // Create 15 classic shooting stars
  for (let i = 0; i < 15; i++) createShootingStar();

  // Create 20 fast dust streaks
  for (let i = 0; i < 20; i++) createDustStreak();
}

function createShootingStar() {
  const sprite = new THREE.Sprite(starMaterial.clone());
  sprite.scale.set(8, 8, 1);

  const trailGeo = new THREE.BufferGeometry();
  const trailPos = new Float32Array(90); // 30 points
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Line(trailGeo, trailMaterial);
  trail.frustumCulled = false;

  const group = new THREE.Group();
  group.add(sprite);
  group.add(trail);
  group.visible = false;
  scene.add(group);

  stars.push({
    type: 'shooting',
    group, sprite, trail,
    positions: trailPos,
    resetDelay: Math.random() * 800 + 400
  });
}

function createDustStreak() {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(6); // just 2 points
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const line = new THREE.Line(geo, dustMaterial.clone());
  line.frustumCulled = false;

  scene.add(line);

  stars.push({
    type: 'dust',
    line,
    positions: pos,
    resetDelay: Math.random() * 300 + 100
  });
}

function resetShootingStar(s) {
  const side = Math.random() > 0.5 ? 1 : -1;
  const angle = Math.random() * Math.PI * 0.35 - Math.PI * 0.175;
  const speed = 1.0 + Math.random() * 1.5;
  const life = 100 + Math.random() * 80;

  s.group.position.set(
    side * (1800 + Math.random() * 1200),
    400 + Math.random() * 600,
    -1800 - Math.random() * 2500
  );
  s.group.visible = true;
  s.age = 0;
  s.life = life;
  s.speed = speed;
  s.dir = new THREE.Vector3(-side * Math.cos(angle), -Math.sin(angle), 0).normalize();
}

function resetDustStreak(s) {
  const w = window.innerWidth * 1.5;
  const h = window.innerHeight * 1.5;

  const startX = -w / 2 + Math.random() * w;
  const startY = h / 2 + 200;
  const endX = startX + (Math.random() - 0.5) * w * 0.6;
  const endY = -h / 2 - 200;

  const worldStart = new THREE.Vector3(startX, startY, -1000).unproject(camera);
  const worldEnd = new THREE.Vector3(endX, endY, -1000).unproject(camera);

  s.line.position.copy(worldStart);
  s.line.scale.setScalar(1);
  s.line.lookAt(worldEnd);
  s.line.scale.setLength(worldStart.distanceTo(worldEnd));

  const p = s.positions;
  p[0] = p[3] = 0;
  p[1] = p[4] = 0;
  p[2] = p[5] = 0;
  s.line.geometry.attributes.position.needsUpdate = true;

  s.age = 0;
  s.life = 30 + Math.random() * 30;
  s.line.material.opacity = 0.3 + Math.random() * 0.3;
  s.line.visible = true;
}

export function updateShootingStars() {
  stars.forEach(s => {
    if (!s.group?.visible && !s.line?.visible) {
      s.resetDelay--;
      if (s.resetDelay <= 0) {
        if (s.type === 'shooting') resetShootingStar(s);
        else resetDustStreak(s);
      }
      return;
    }

    s.age++;

    if (s.type === 'shooting') {
      const t = s.age / s.life;
      if (t >= 1) {
        s.group.visible = false;
        s.resetDelay = Math.random() * 800 + 400;
        return;
      }

      s.group.position.addScaledVector(s.dir, s.speed);

      // Trail
      const pos = s.group.position;
      const trail = s.positions;
      const len = Math.min(Math.floor(t * 28), 28) * 3;

      for (let i = 0; i < len; i += 3) {
        const back = 1 - (i / 3) / 28;
        trail[i]     = pos.x - s.dir.x * back * 80;
        trail[i + 1] = pos.y - s.dir.y * back * 80;
        trail[i + 2] = pos.z - s.dir.z * back * 80;
      }
      s.trail.geometry.attributes.position.needsUpdate = true;

      const op = Math.sin(t * Math.PI);
      s.sprite.material.opacity = 0.9 * op;
      s.trail.material.opacity = 0.4 * op;

    } else {
      // Dust streak
      const t = s.age / s.life;
      if (t >= 1) {
        s.line.visible = false;
        s.resetDelay = Math.random() * 300 + 100;
        return;
      }

      s.line.material.opacity = (1 - t) * s.line.material.opacity;
    }
  });
}