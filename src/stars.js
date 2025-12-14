// src/stars.js — FINAL: 12 RARE, FAST, DUAL-COLOR METEORS WITH SOFT FADE
import * as THREE from 'three';

const meteors = [];
const MIN_HEAD_SIZE = 70;
const MAX_HEAD_SIZE = 140;
let scene, camera;
let staticStars;

const trailMaterial = new THREE.ShaderMaterial({
  uniforms: { color: { value: new THREE.Color(0xffaa55) } },
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

export function initShootingStars(_scene, _camera) {
  scene = _scene;
  camera = _camera;
  createStaticStarfield();

  // 12 total meteors — some fire, some ice
  for (let i = 0; i < 24; i++) createMeteor();
}

function createStaticStarfield() {
  const count = 16000;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = 3000 + Math.random() * 5000;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i*3+2] = r * Math.cos(phi);
    sizes[i] = 2.5 + Math.random() * 4.5;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 1, color: 0xffffff, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });

  mat.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <size>', 'attribute float size;')
      .replace('gl_PointSize = size;', 'gl_PointSize = size * 300.0 / -mvPosition.z;');
  };

  staticStars = new THREE.Points(geo, mat);
  scene.add(staticStars);
}

function createMeteor() {
    const maxParticles = 3200;
  
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const alphas = new Float32Array(maxParticles);
  
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  
    const material = trailMaterial.clone();
  
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.visible = false;
    scene.add(points);
  
    const headSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(generateGlowTexture()),
        color: 0xffeeaa,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    // Size will be set per-meteor in resetMeteor()
    headSprite.visible = false;
    scene.add(headSprite);
  
    const particles = [];
  
    meteors.push({
      points,
      headSprite,
      geometry,
      positions,
      sizes,
      alphas,
      particles,
      material,
      headPos: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      speed: 0,
      life: 0,
      age: 0,
      fadeProgress: 0,
      isFading: false,
      resetDelay: Math.random() * 2600
    });
  }

function generateGlowTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0.0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.25, 'rgba(255,240,200,1)');
  gradient.addColorStop(0.5, 'rgba(255,180,120,0.9)');
  gradient.addColorStop(0.8, 'rgba(255,100,60,0.5)');
  gradient.addColorStop(1.0, 'rgba(255,50,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

function resetMeteor(s) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
  
    const depth = -3200 - Math.random() * 5000;
    const x = side * (2800 + Math.random() * 2400);
    const y = 1000 + Math.random() * 1600;
  
    s.headPos.set(x, y, depth);
    s.dir.set(-side * Math.cos(angle), -Math.sin(angle), (Math.random() - 0.5) * 0.25).normalize();
  
    s.speed = 8.0 + Math.random() * 6.0;
    s.life = 100 + Math.random() * 50;
    s.age = 0;
    s.fadeProgress = 0;
    s.isFading = false;
  
    s.particles.length = 0;
    s.positions.fill(0);
    s.sizes.fill(0);
    s.alphas.fill(0);
    s.geometry.attributes.position.needsUpdate = true;
    s.geometry.attributes.size.needsUpdate = true;
    s.geometry.attributes.alpha.needsUpdate = true;
  
    s.points.visible = true;
    s.headSprite.visible = true;
    s.headSprite.position.copy(s.headPos);
  
    // RANDOM HEAD SIZE — feels alive and varied!
    const headSize = MIN_HEAD_SIZE + Math.random() * (MAX_HEAD_SIZE - MIN_HEAD_SIZE);
    s.headSprite.scale.set(headSize, headSize, 1);
  
    // 50/50 fiery or icy
    if (Math.random() < 0.5) {
      s.headSprite.material.color.setHSL(0.1, 1.0, 0.92);
      s.material.uniforms.color.value.setHSL(0.08, 1.0, 0.72);
    } else {
      s.headSprite.material.color.setHSL(0.58, 0.9, 0.94);
      s.material.uniforms.color.value.setHSL(0.58, 0.9, 0.78);
    }
  }

export function updateShootingStars() {
  if (staticStars) staticStars.rotation.y += 0.00002;

  meteors.forEach(s => {
    if (!s.points.visible && !s.isFading) {
      s.resetDelay--;
      if (s.resetDelay <= 0) resetMeteor(s);
      return;
    }

    s.age++;

    // Start fading near the end
    if (s.age > s.life * 0.8 && !s.isFading) {
      s.isFading = true;
    }

    if (s.isFading) {
      s.fadeProgress += 0.015;  // Smooth fade over ~60 frames
      if (s.fadeProgress >= 1) {
        s.points.visible = false;
        s.headSprite.visible = false;
        s.isFading = false;
        s.fadeProgress = 0;
        s.resetDelay = 1800 + Math.random() * 3600;
        return;
      }
    }

    // Emission
    const count = 20 + Math.floor(Math.random() * 15);
    for (let i = 0; i < count; i++) {
      if (s.particles.length >= 1600) break;
      s.particles.push({
        pos: s.headPos.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 32,
          (Math.random() - 0.5) * 32,
          (Math.random() - 0.5) * 32
        )),
        life: 1.0,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 95,
          (Math.random() - 0.5) * 95,
          (Math.random() - 0.5) * 55
        )
      });
    }

    // Update particles
    let idx = 0;
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.life -= 0.023;
      p.pos.addScaledVector(p.vel, 0.023);

      if (p.life > 0) {
        const alpha = p.life * 0.95 * (1 - s.fadeProgress);
        s.positions[idx * 3]     = p.pos.x;
        s.positions[idx * 3 + 1] = p.pos.y;
        s.positions[idx * 3 + 2] = p.pos.z;
        s.sizes[idx]     = p.life * (14 + Math.random() * 20);
        s.alphas[idx]    = alpha;
        idx++;
      }
    }

    while (s.particles.length && s.particles[0].life <= 0) s.particles.shift();
    for (; idx < 1600; idx++) s.sizes[idx] = s.alphas[idx] = 0;

    s.geometry.attributes.position.needsUpdate = true;
    s.geometry.attributes.size.needsUpdate = true;
    s.geometry.attributes.alpha.needsUpdate = true;

    // Fade head too
    s.headSprite.material.opacity = 1 - s.fadeProgress;

    // Move forward
    s.headPos.addScaledVector(s.dir, s.speed);
    s.headSprite.position.copy(s.headPos);
  });
}