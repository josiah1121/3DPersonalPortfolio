// src/skills.js — Enhanced 3D glow for angled viewing (no billboarding + view-based halo)
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
  { name: "Python", color: 0x00ff88 },
  { name: "Swift", color: 0x00ffff },
  { name: "JavaScript", color: 0xffff00 },
  { name: "AWS", color: 0xff8800 },
  { name: "Three.js", color: 0x00aaff },
  { name: "DevOps", color: 0xff00ff },
  { name: "Git", color: 0xffffff },
  { name: "MongoDB", color: 0x00ff00 },
  { name: "Firebase", color: 0xffaa00 }
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
    orbGroup.position.y = Math.sin(i * 0.5) * 200;

    // Tilt toward camera
    orbGroup.rotation.y = THREE.MathUtils.degToRad(20);

    // === Colored particle cloud (NO billboarding — true 3D glow) ===
    const cloudPositions = new Float32Array(cloudParticles * 3);
    const cloudSizes = new Float32Array(cloudParticles);

    for (let j = 0; j < cloudParticles; j++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 90 * Math.cbrt(Math.random());

      cloudPositions[j * 3]     = r * Math.sin(phi) * Math.cos(theta);
      cloudPositions[j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      cloudPositions[j * 3 + 2] = r * Math.cos(phi);

      cloudSizes[j] = 8 + Math.random() * 12;
    }

    const cloudGeometry = new THREE.BufferGeometry();
    cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    cloudGeometry.setAttribute('size', new THREE.BufferAttribute(cloudSizes, 1));

    const cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(skill.color) },
        uOpacity: { value: 0.9 },
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

    // === White text particles ===
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(skill.name, canvas.width / 2, canvas.height / 2);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const textPositions = [];

    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] > 128) {
          const px = (x - canvas.width / 2) * 0.4;
          const py = -(y - canvas.height / 2) * 0.4;
          textPositions.push(px, py, Math.random() * 20 - 10);
        }
      }
    }

    const textGeometry = new THREE.BufferGeometry();
    const textPosArray = new Float32Array(textPositions);
    const textSizes = new Float32Array(textPositions.length / 3).fill(10);

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
    orbGroup.add(textParticles);

    // === View-angle glow halo (makes it pop from tilted angles) ===
    const glowHalo = new THREE.Mesh(
      new THREE.SphereGeometry(100, 32, 16),
      new THREE.MeshBasicMaterial({
        color: skill.color,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide // Glows outward
      })
    );
    orbGroup.add(glowHalo);

    // Save references
    orbGroup.userData = {
      cloud: cloud,
      textParticles: textParticles,
      glowHalo: glowHalo,
      cloudMaterial: cloudMaterial,
      textMaterial: textMaterial,
      baseOpacity: 0.9,
      hoverOpacity: 1.6,
      baseScale: 1.0,
      hoverScale: 1.4,
      timeOffset: Math.random() * Math.PI * 2
    };

    skillsGroup.add(orbGroup);
  });

  return skillsGroup;
}

export function updateSkills(camera, mouse, raycaster) {
  if (!skillsGroup) return;

  const time = performance.now() * 0.001;

  skillsGroup.children.forEach(orbGroup => {
    const ud = orbGroup.userData;

    // Floating
    orbGroup.position.y += Math.sin(time * 1.2 + ud.timeOffset) * 0.7;

    // Hover
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(orbGroup, true);
    const hovered = intersects.length > 0;

    const targetOpacity = hovered ? ud.hoverOpacity : ud.baseOpacity;
    ud.cloudMaterial.uniforms.uOpacity.value += (targetOpacity - ud.cloudMaterial.uniforms.uOpacity.value) * 0.12;
    ud.textMaterial.uniforms.uOpacity.value += (targetOpacity - ud.textMaterial.uniforms.uOpacity.value) * 0.12;

    // Halo intensity
    ud.glowHalo.material.opacity = 0.15 + (hovered ? 0.3 : 0);

    const targetScale = hovered ? ud.hoverScale : ud.baseScale;
    orbGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

    // Pulse cloud
    const cloudPos = ud.cloud.geometry.attributes.position.array;
    const pulseStrength = hovered ? 25 : 10;
    for (let i = 0; i < cloudPos.length; i += 3) {
      const pulse = Math.sin(time * 8 + i * 0.04) * pulseStrength;
      cloudPos[i] += pulse * 0.012;
      cloudPos[i + 1] += pulse * 0.018;
      cloudPos[i + 2] += pulse * 0.012;
    }
    ud.cloud.geometry.attributes.position.needsUpdate = true;
  });
}