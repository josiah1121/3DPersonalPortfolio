// src/skills.js — FINAL: Perfect alignment + full-range natural drag/throw
import * as THREE from 'three';
import { mouse, isMouseOver } from './cursor.js';

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

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); 
const dragPlane = new THREE.Plane(); // Dynamic plane facing camera
const cursorWorldPos = new THREE.Vector3();
const prevCursorWorldPos = new THREE.Vector3();

let grabbedOrb = null;
let isDragging = false;
const dragThreshold = 8; 
let startMouse = new THREE.Vector2();

let orbitControls = null;

export function setOrbitControls(controls) {
  orbitControls = controls;
}

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
    orbGroup.rotation.y = THREE.MathUtils.degToRad(20);

    const cloudPositions = new Float32Array(cloudParticles * 3);
    const cloudSizes = new Float32Array(cloudParticles);
    for (let j = 0; j < cloudParticles; j++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 90 * Math.cbrt(Math.random());
      cloudPositions[j * 3] = r * Math.sin(phi) * Math.cos(theta);
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

    const originalPos = orbGroup.position.clone();

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
      timeOffset: Math.random() * Math.PI * 2,
      velocities: new Float32Array(cloudParticles * 3),
      homePositions: cloudPositions.slice(),
      originalOrbitalPos: originalPos,
      currentVelocity: new THREE.Vector3()
    };

    skillsGroup.add(orbGroup);
  });

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  return skillsGroup;
}

function onPointerDown(event) {
  if (!isMouseOver || !skillsGroup || !orbitControls || event.button !== 0) return;

  raycaster.setFromCamera(mouse, orbitControls.object);
  const intersects = raycaster.intersectObjects(skillsGroup.children, true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj.parent && obj.parent !== skillsGroup) obj = obj.parent;
    const orb = obj;

    if (orb && orb.parent === skillsGroup) {
      grabbedOrb = orb;
      startMouse.set(event.clientX, event.clientY);
      isDragging = false;
      event.stopPropagation();
    }
  }
}

function onPointerMove(event) {
  if (!grabbedOrb || !isMouseOver) return;

  const dx = event.clientX - startMouse.x;
  const dy = event.clientY - startMouse.y;

  if (!isDragging && Math.hypot(dx, dy) > dragThreshold) {
    isDragging = true;
    orbitControls.enabled = false;
    
    // Create a plane facing the camera at the orb's current depth
    const orbWorldPos = new THREE.Vector3();
    grabbedOrb.getWorldPosition(orbWorldPos);
    
    const cameraDir = new THREE.Vector3();
    orbitControls.object.getWorldDirection(cameraDir);
    // Plane faces opposite to camera direction
    dragPlane.setFromNormalAndCoplanarPoint(cameraDir.negate(), orbWorldPos);

    prevCursorWorldPos.copy(orbWorldPos);
    grabbedOrb.userData.currentVelocity.set(0, 0, 0);
  }

  if (isDragging) {
    raycaster.setFromCamera(mouse, orbitControls.object);
    // Raycast against the camera-facing plane for XY movement
    if (raycaster.ray.intersectPlane(dragPlane, cursorWorldPos)) {
      const currentWorldPos = cursorWorldPos.clone();

      // Convert world coordinate to skillsGroup local space
      const localPos = currentWorldPos.clone();
      skillsGroup.worldToLocal(localPos);

      grabbedOrb.position.copy(localPos);

      // Track velocity in world space for a natural throw feel
      const delta = currentWorldPos.clone().sub(prevCursorWorldPos);
      const frameVelocity = delta.multiplyScalar(60);
      grabbedOrb.userData.currentVelocity.lerp(frameVelocity, 0.5);

      prevCursorWorldPos.copy(currentWorldPos);
    }
  }
}

function onPointerUp(event) {
  if (grabbedOrb) {
    if (isDragging) {
      orbitControls.enabled = true;
    }
    grabbedOrb = null;
    isDragging = false;
  }
}

export function updateSkills(camera) {
  if (!skillsGroup) return;

  const time = performance.now() * 0.001;
  skillsGroup.rotation.y = time * 0.15;

  let cursorInWorld = null;
  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(groundPlane, cursorWorldPos)) {
      cursorInWorld = cursorWorldPos.clone();
      cursorInWorld.y = 10;
    }
  }

  skillsGroup.children.forEach(orbGroup => {
    const ud = orbGroup.userData;

    if (grabbedOrb !== orbGroup) {
      const vel = ud.currentVelocity;
      const toHome = ud.originalOrbitalPos.clone().sub(orbGroup.position);

      vel.add(toHome.multiplyScalar(0.08));
      vel.multiplyScalar(0.88);

      orbGroup.position.add(vel.clone().multiplyScalar(0.016));

      const floatOffset = Math.sin(time * 1.2 + ud.timeOffset) * 0.7;
      orbGroup.position.y += floatOffset;
      // Floor constraint only active when NOT dragging
      if (orbGroup.position.y < 20) orbGroup.position.y = 20;
    }

    if (ud.textParticles.userData.billboard) {
      ud.textParticles.lookAt(camera.position);
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(orbGroup, true);
    const hovered = intersects.length > 0 && grabbedOrb !== orbGroup;

    const targetOpacity = hovered ? ud.hoverOpacity : ud.baseOpacity;
    ud.cloudMaterial.uniforms.uOpacity.value += (targetOpacity - ud.cloudMaterial.uniforms.uOpacity.value) * 0.12;
    ud.textMaterial.uniforms.uOpacity.value += (targetOpacity - ud.textMaterial.uniforms.uOpacity.value) * 0.12;
    ud.glowHalo.material.opacity = 0.12 + (hovered ? 0.35 : 0);

    const targetScale = hovered ? ud.hoverScale : ud.baseScale;
    orbGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);

    const cloudPos = ud.cloud.geometry.attributes.position.array;
    const pulseStrength = hovered ? 18 : 6;
    for (let i = 0; i < cloudPos.length; i += 3) {
      const pulse = Math.sin(time * 8 + i * 0.04) * pulseStrength;
      cloudPos[i] += pulse * 0.01;
      cloudPos[i + 1] += pulse * 0.015;
      cloudPos[i + 2] += pulse * 0.01;
    }

    if (hovered && cursorInWorld) {
      const repulseRadius = 65;
      const strength = 10;
      const damp = 0.45;
      const spring = 0.025;

      orbGroup.updateMatrixWorld();
      const localCursor = cursorInWorld.clone().applyMatrix4(orbGroup.matrixWorld.clone().invert());

      for (let i = 0; i < cloudPos.length; i += 3) {
        let vx = ud.velocities[i];
        let vy = ud.velocities[i + 1];
        let vz = ud.velocities[i + 2];

        vx += (ud.homePositions[i] - cloudPos[i]) * spring;
        vy += (ud.homePositions[i + 1] - cloudPos[i + 1]) * spring;
        vz += (ud.homePositions[i + 2] - cloudPos[i + 2]) * spring;

        const dx = cloudPos[i] - localCursor.x;
        const dy = cloudPos[i + 1] - localCursor.y;
        const dz = cloudPos[i + 2] - localCursor.z;
        const dSq = dx*dx + dy*dy + dz*dz;

        if (dSq < repulseRadius * repulseRadius && dSq > 1) {
          const dist = Math.sqrt(dSq);
          const force = strength * (1 - dist / repulseRadius);
          vx += (dx / dist) * force;
          vy += (dy / dist) * force;
          vz += (dz / dist) * force;
        }

        vx *= damp;
        vy *= damp;
        vz *= damp;

        ud.velocities[i] = vx;
        ud.velocities[i + 1] = vy;
        ud.velocities[i + 2] = vz;

        cloudPos[i] += vx;
        cloudPos[i + 1] += vy;
        cloudPos[i + 2] += vz;
      }
    } else {
      for (let i = 0; i < cloudPos.length; i += 3) {
        cloudPos[i] += (ud.homePositions[i] - cloudPos[i]) * 0.02;
        cloudPos[i + 1] += (ud.homePositions[i + 1] - cloudPos[i + 1]) * 0.02;
        cloudPos[i + 2] += (ud.homePositions[i + 2] - cloudPos[i + 2]) * 0.02;
      }
    }

    ud.cloud.geometry.attributes.position.needsUpdate = true;

    if (cursorInWorld && isMouseOver && grabbedOrb !== orbGroup) {
      orbGroup.updateMatrixWorld();
      const orbWorldPos = new THREE.Vector3();
      orbGroup.getWorldPosition(orbWorldPos);
      const toCursor = orbWorldPos.clone().sub(cursorInWorld);
      const distance = toCursor.length();
      if (distance < 600 && distance > 50) {
        const force = (1 - distance / 600) * 90;
        toCursor.normalize();
        orbGroup.position.add(toCursor.multiplyScalar(force * 0.016));
      }
    }
  });
}