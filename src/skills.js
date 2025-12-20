// src/skills.js — Orbs now slowly orbit around each other
import * as THREE from 'three';

// Soft circular particle texture
function generateParticleTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(200,200,255,0.8)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new THREE.CanvasTexture(canvas);
}

const particleTexture = generateParticleTexture();

let skillsGroup = null;

const skills = [
  { name: "Python", color: 0x44aa88 },
  { name: "Swift", color: 0x88dddd },
  { name: "JavaScript", color: 0xdddd88 },
  { name: "AWS", color: 0xccaa77 },
  { name: "Three.js", color: 0x88aadd },
  { name: "DevOps", color: 0xccaaff },
  { name: "Git", color: 0xdddddd },
  { name: "MongoDB", color: 0x88cc88 },
  { name: "Firebase", color: 0xddbb88 }
];

const cloudParticles = 2500;

export function createSkillsArea(scene) {
  skillsGroup = new THREE.Group();
  skillsGroup.position.set(-1100, 100, -800);
  scene.add(skillsGroup);

  skills.forEach((skill, i) => {
    const orbGroup = new THREE.Group();

    const angle = (i / skills.length) * Math.PI * 2;
    orbGroup.position.x = Math.cos(angle) * 500;
    orbGroup.position.z = Math.sin(angle) * 500;
    orbGroup.position.y = Math.sin(i * 0.5) * 200; // Slight vertical variation

    orbGroup.rotation.y = THREE.MathUtils.degToRad(20);

    // === Subtle colored background cloud ===
    const cloudPositions = new Float32Array(cloudParticles * 3);
    const cloudSizes = new Float32Array(cloudParticles);

    for (let j = 0; j < cloudParticles; j++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 90 * Math.cbrt(Math.random());

      cloudPositions[j * 3]     = r * Math.sin(phi) * Math.cos(theta);
      cloudPositions[j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      cloudPositions[j * 3 + 2] = r * Math.cos(phi);

      cloudSizes[j] = 6 + Math.random() * 8;
    }

    const cloudGeometry = new THREE.BufferGeometry();
    cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    cloudGeometry.setAttribute('size', new THREE.BufferAttribute(cloudSizes, 1));

    const cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(skill.color) },
        uOpacity: { value: 0.6 },
        pointTexture: { value: particleTexture }
      },
      vertexShader: `
        attribute float size;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float uOpacity;
        uniform sampler2D pointTexture;
        void main() {
          vec4 texColor = texture2D(pointTexture, gl_PointCoord);
          gl_FragColor = vec4(color, uOpacity) * texColor;
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

    const cloud = new THREE.Points(cloudGeometry, cloudMaterial);
    orbGroup.add(cloud);

    // === Text particles ===
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(skill.name, canvas.width / 2, canvas.height / 2);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const textPositions = [];

    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] > 128) {
          const px = (x - canvas.width / 2) * 0.35;
          const py = -(y - canvas.height / 2) * 0.35;
          textPositions.push(px, py, Math.random() * 15 - 7.5);
        }
      }
    }

    const textGeometry = new THREE.BufferGeometry();
    const textPosArray = new Float32Array(textPositions);
    const textSizes = new Float32Array(textPositions.length / 3).fill(7);

    textGeometry.setAttribute('position', new THREE.BufferAttribute(textPosArray, 3));
    textGeometry.setAttribute('size', new THREE.BufferAttribute(textSizes, 1));

    const textMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        uOpacity: { value: 1.0 },
        pointTexture: { value: particleTexture }
      },
      vertexShader: cloudMaterial.vertexShader,
      fragmentShader: cloudMaterial.fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });

    const textParticles = new THREE.Points(textGeometry, textMaterial);
    textParticles.userData.billboard = true;
    orbGroup.add(textParticles);

    // === Tight halo ===
    const glowHalo = new THREE.Mesh(
      new THREE.SphereGeometry(95, 32, 16),
      new THREE.MeshBasicMaterial({
        color: skill.color,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
      })
    );
    orbGroup.add(glowHalo);

    orbGroup.userData = {
      cloud,
      textParticles,
      glowHalo,
      cloudMaterial,
      textMaterial,
      baseOpacity: 0.6,
      hoverOpacity: 1.2,
      baseScale: 1.0,
      hoverScale: 1.3,
      timeOffset: Math.random() * Math.PI * 2
    };

    skillsGroup.add(orbGroup);
  });

  return skillsGroup;
}

export function updateSkills(camera, mouse, raycaster) {
  if (!skillsGroup) return;

  const time = performance.now() * 0.001;

  // === Slow orbital rotation of the entire group ===
  skillsGroup.rotation.y = time * 0.15; // Adjust 0.15 for speed (smaller = slower)

  skillsGroup.children.forEach(orbGroup => {
    const ud = orbGroup.userData;

    // Subtle individual vertical floating (on top of orbital motion)
    const floatOffset = Math.sin(time * 1.2 + ud.timeOffset) * 0.7;
    orbGroup.position.y += floatOffset;

    // === PREVENT ORBS FROM GOING BELOW GROUND ===
    // Ground is at y = -80, skillsGroup base at y = 100 → lowest orb should stay comfortably above
    const minY = 20; // Safe buffer above ground (you can adjust if needed, but 20 is plenty)
    if (orbGroup.position.y < minY) {
      orbGroup.position.y = minY;
    }

    // Billboarding for text
    if (ud.textParticles.userData.billboard) {
      ud.textParticles.lookAt(camera.position);
    }

    // Hover detection
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(orbGroup, true);
    const hovered = intersects.length > 0;

    // Cloud & text opacity
    const targetOpacity = hovered ? ud.hoverOpacity : ud.baseOpacity;
    ud.cloudMaterial.uniforms.uOpacity.value += (targetOpacity - ud.cloudMaterial.uniforms.uOpacity.value) * 0.12;
    ud.textMaterial.uniforms.uOpacity.value += (targetOpacity - ud.textMaterial.uniforms.uOpacity.value) * 0.12;

    // Halo glow
    ud.glowHalo.material.opacity = 0.12 + (hovered ? 0.35 : 0);

    // Scale on hover
    const targetScale = hovered ? ud.hoverScale : ud.baseScale;
    orbGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

    // Gentle cloud pulse
    const cloudPos = ud.cloud.geometry.attributes.position.array;
    const pulseStrength = hovered ? 18 : 6;
    for (let i = 0; i < cloudPos.length; i += 3) {
      const pulse = Math.sin(time * 8 + i * 0.04) * pulseStrength;
      cloudPos[i]     += pulse * 0.01;
      cloudPos[i + 1] += pulse * 0.015;
      cloudPos[i + 2] += pulse * 0.01;
    }
    ud.cloud.geometry.attributes.position.needsUpdate = true;
  });
}