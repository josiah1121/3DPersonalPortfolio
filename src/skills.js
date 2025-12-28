// src/skills.js — Blue grid dome + Skills orbs + Ground halo + Upward glowing light beams
import * as THREE from 'three';
import { mouse, isMouseOver } from './cursor.js';

let infoCardRef = null;

export function setInfoCard(card) {
  infoCardRef = card;
}

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
  { "name": "Python", "color": 0x44aa88, "years": "Data & Automation", "description": "Leveraged Python to build end-to-end data pipelines, perform advanced analytics and visualization, and automate complex business and operational processes." },
  { "name": "Swift", "color": 0x88dddd, "years": "iOS/Mobile", "description": "Built engaging and user-friendly consumer iOS applications using Swift, SwiftUI, and modern Apple frameworks to deliver practical, everyday value to users." },
  { "name": "JavaScript", "color": 0xdddd88, "years": "Automation & Web", "description": "Automated business workflows and operations using JavaScript, including custom integrations and scripts in Zapier, Make.com, and Node.js to streamline processes, sync data across tools, and eliminate repetitive tasks." },
  { "name": "AWS", "color": 0xccaa77, "years": "Cloud Infrastructure", "description": "Implemented serverless architectures using Lambda and S3 for scalable data storage solutions." },
  { "name": "Three.js", "color": 0x88aadd, "years": "3D Web Experiences", "description": "Built immersive and interactive 3D websites and web applications using Three.js, creating engaging visual experiences such as product showcases, architectural visualizations, portfolio sites, and creative landing pages." },
  { "name": "DevOps", "color": 0xccaaff, "years": "CI/CD", "description": "Architected robust pipelines for safety-critical embedded software, ensuring high-reliability deployments. Click below to simulate a live deployment sequence." },
  { "name": "Git", "color": 0xdddddd, "years": "Version Control", "description": "Managed complex multi-branch release cycles for mission-critical software environments." },
  { "name": "MongoDB", "color": 0x88cc88, "years": "NoSQL Databases", "description": "Designed schema-less data structures for high-speed logging and asynchronous event tracking." },
  { "name": "Firebase", "color": 0xddbb88, "years": "Real-time Services", "description": "Utilized real-time listeners for instant synchronization across distributed interfaces." },
  { "name": "TypeScript", "color": 0x3178c6, "years": "Server & Automation", "description": "Built server-side TypeScript applications (Node.js) to automate daily data analysis pipelines, including scheduled data ingestion, processing, transformation, and reporting with strict type safety." },
  { "name": "C++", "color": 0x00599c, "years": "Embedded & Hardware Testing", "description": "Developed hardware-in-the-loop (HIL) testing modules in C++ to interface with missile system components, verify health and functionality through automated tests, and communicate with sensors, actuators, and control units; also gained embedded systems experience prototyping and controlling devices with Arduino." },
  { "name": "Linux", "color": 0xffa500, "years": "Platform Engineering", "description": "Developed and tested real-time software for mission-critical hardware-in-the-loop systems on RTOS and embedded Linux platforms." },
  { "name": "Groovy", "color": 0x619dbc, "years": "CI/CD Pipelines", "description": "Wrote declarative and scripted Jenkins pipelines in Groovy to orchestrate complex build, test, and deployment workflows; developed reusable shared libraries for standardized pipeline infrastructure across teams and projects." }
];

const cloudParticles = 2500;
const domeRadius = 580;
const innerRadius = 480;
const orbitalCircleRadius = 380;
const heightVariance = 180;
const upwardParticleCount = 1200;
const upwardMaxHeight = domeRadius * 1.9;

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const dragPlane = new THREE.Plane();
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

function createGridDome() {
  const radius = domeRadius;
  const segmentsLat = 48;
  const segmentsLon = 24;
  const domeGroup = new THREE.Group();
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x00eeff,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending
  });
  domeGroup.userData.lineMaterial = lineMaterial;

  for (let i = 0; i < segmentsLat; i++) {
    const phi = (i / segmentsLat) * Math.PI * 2;
    const points = [];
    for (let j = 0; j <= segmentsLon; j++) {
      const theta = (j / segmentsLon) * Math.PI;
      points.push(new THREE.Vector3(radius * Math.sin(theta) * Math.cos(phi), radius * Math.cos(theta), radius * Math.sin(theta) * Math.sin(phi)));
    }
    domeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
  }
  for (let j = 1; j < segmentsLon; j++) {
    const theta = (j / segmentsLon) * Math.PI;
    const points = [];
    for (let i = 0; i <= segmentsLat; i++) {
      const phi = (i / segmentsLat) * Math.PI * 2;
      points.push(new THREE.Vector3(radius * Math.sin(theta) * Math.cos(phi), radius * Math.cos(theta), radius * Math.sin(theta) * Math.sin(phi)));
    }
    domeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMaterial));
  }
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(radius * 0.98, radius * 1.02, 64), new THREE.MeshBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  glowRing.rotation.x = -Math.PI / 2;
  domeGroup.add(glowRing);
  domeGroup.userData.isDome = true;
  return domeGroup;
}

export function createSkillsArea(scene) {
  skillsGroup = new THREE.Group();
  // Move slightly closer to center and lower Y to remain prominent in the new FOV
  skillsGroup.position.set(-900, 350, -800); 
  if (scene) scene.add(skillsGroup);

  skillsGroup.add(createGridDome());

  const groundRing = new THREE.Mesh(new THREE.RingGeometry(domeRadius * 0.95, domeRadius * 1.05, 72, 1), new THREE.MeshBasicMaterial({ color: 0x00ccff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = -domeRadius + 5;
  groundRing.userData = { isGroundRing: true, baseOpacity: 0.5, baseScale: 1.0 };
  skillsGroup.add(groundRing);

  const innerGlow = new THREE.Mesh(new THREE.RingGeometry(domeRadius * 0.7, domeRadius * 0.85, 64), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
  innerGlow.rotation.x = -Math.PI / 2;
  innerGlow.position.y = groundRing.position.y;
  skillsGroup.add(innerGlow);

  const upwardPositions = new Float32Array(upwardParticleCount * 3);
  const upwardSizes = new Float32Array(upwardParticleCount);
  const upwardAlphas = new Float32Array(upwardParticleCount);
  const upwardSpeeds = new Float32Array(upwardParticleCount);
  const baseY = groundRing.position.y + 10;

  for (let i = 0; i < upwardParticleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = domeRadius * (0.7 + Math.random() * 0.35);
    upwardPositions[i * 3] = Math.cos(angle) * radius;
    upwardPositions[i * 3 + 1] = baseY + Math.random() * 50;
    upwardPositions[i * 3 + 2] = Math.sin(angle) * radius;
    // INCREASED SIZE: From 8-14 to 16-28 for visibility at distance
    upwardSizes[i] = 16 + Math.random() * 12; 
    upwardAlphas[i] = Math.random();
    upwardSpeeds[i] = 25 + Math.random() * 40;
  }

  const upwardGeometry = new THREE.BufferGeometry();
  upwardGeometry.setAttribute('position', new THREE.BufferAttribute(upwardPositions, 3));
  upwardGeometry.setAttribute('size', new THREE.BufferAttribute(upwardSizes, 1));
  upwardGeometry.setAttribute('alpha', new THREE.BufferAttribute(upwardAlphas, 1));

  const upwardLights = new THREE.Points(upwardGeometry, new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(0x80ff80) }, pointTexture: { value: particleTexture } },
    vertexShader: `attribute float size; attribute float alpha; varying float vAlpha; void main() { vAlpha = alpha; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (400.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`,
    fragmentShader: `uniform vec3 color; uniform sampler2D pointTexture; varying float vAlpha; void main() { vec4 texColor = texture2D(pointTexture, gl_PointCoord); gl_FragColor = vec4(color, texColor.a * vAlpha); }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  }));
  upwardLights.userData = { isUpwardLights: true, positions: upwardPositions, alphas: upwardAlphas, speeds: upwardSpeeds, baseY: baseY };
  skillsGroup.add(upwardLights);

  skills.forEach((skill, i) => {
    const orbGroup = new THREE.Group();
    const angle = (i / skills.length) * Math.PI * 2;
    orbGroup.position.set(Math.cos(angle) * orbitalCircleRadius, Math.sin(angle * 3 + i) * heightVariance, Math.sin(angle) * orbitalCircleRadius);

    const cloudPositions = new Float32Array(cloudParticles * 3);
    const cloudSizes = new Float32Array(cloudParticles);
    for (let j = 0; j < cloudParticles; j++) {
      const theta = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1), r = 90 * Math.cbrt(Math.random());
      cloudPositions[j * 3] = r * Math.sin(phi) * Math.cos(theta);
      cloudPositions[j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      cloudPositions[j * 3 + 2] = r * Math.cos(phi);
      // INCREASED SIZE: From 6-8 to 10-14
      cloudSizes[j] = 10 + Math.random() * 4;
    }

    const cloudMaterial = new THREE.ShaderMaterial({
      // INCREASED OPACITY: From 0.6 to 0.8
      uniforms: { color: { value: new THREE.Color(skill.color) }, uOpacity: { value: 0.8 }, pointTexture: { value: particleTexture } },
      vertexShader: `attribute float size; void main() { vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (400.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition; }`,
      fragmentShader: `uniform vec3 color; uniform float uOpacity; uniform sampler2D pointTexture; void main() { vec4 texColor = texture2D(pointTexture, gl_PointCoord); gl_FragColor = vec4(color, uOpacity) * texColor; }`,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
    });

    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
    cloudGeo.setAttribute('size', new THREE.BufferAttribute(cloudSizes, 1));
    orbGroup.add(new THREE.Points(cloudGeo, cloudMaterial));

    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; ctx.font = 'bold 100px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(skill.name, canvas.width / 2, canvas.height / 2);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const textPos = [];
    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        if (data[(y * canvas.width + x) * 4 + 3] > 128) textPos.push((x - canvas.width / 2) * 0.35, -(y - canvas.height / 2) * 0.35, Math.random() * 15 - 7.5);
      }
    }
    const textGeo = new THREE.BufferGeometry();
    textGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(textPos), 3));
    // INCREASED SIZE: From 7 to 12
    textGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(textPos.length / 3).fill(12), 1));
    const textMaterial = cloudMaterial.clone();
    textMaterial.uniforms.color.value.set(0xffffff);
    textMaterial.uniforms.uOpacity.value = 1.0;
    const textParticles = new THREE.Points(textGeo, textMaterial);
    textParticles.userData.billboard = true;
    orbGroup.add(textParticles);

    const glowHalo = new THREE.Mesh(new THREE.SphereGeometry(95, 32, 16), new THREE.MeshBasicMaterial({ color: skill.color, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, side: THREE.BackSide }));
    orbGroup.add(glowHalo);

    orbGroup.userData = { skillData: skill, cloud: orbGroup.children[0], textParticles, glowHalo, cloudMaterial, textMaterial, baseOpacity: 0.8, hoverOpacity: 1.4, baseScale: 1.0, hoverScale: 1.3, timeOffset: Math.random() * Math.PI * 2, velocities: new Float32Array(cloudParticles * 3), homePositions: cloudPositions.slice(), originalOrbitalPos: orbGroup.position.clone(), currentVelocity: new THREE.Vector3() };
    skillsGroup.add(orbGroup);
  });

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  return skillsGroup;
}

function onPointerDown(event) {
  if (!isMouseOver || !skillsGroup || !orbitControls) return;
  raycaster.setFromCamera(mouse, orbitControls.object);
  const intersects = raycaster.intersectObjects(skillsGroup.children, true);
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj.parent && obj.parent !== skillsGroup) obj = obj.parent;
    if (obj.userData.cloud) {
      grabbedOrb = obj;
      startMouse.set(event.clientX, event.clientY);
      isDragging = false;
      event.stopPropagation();
    }
  }
}

function onPointerMove(event) {
  if (!grabbedOrb || !isMouseOver) return;
  const dx = event.clientX - startMouse.x, dy = event.clientY - startMouse.y;
  if (!isDragging && Math.hypot(dx, dy) > dragThreshold) {
    isDragging = true;
    orbitControls.enabled = false;
    const orbWorldPos = new THREE.Vector3();
    grabbedOrb.getWorldPosition(orbWorldPos);
    dragPlane.setFromNormalAndCoplanarPoint(orbitControls.object.getWorldDirection(new THREE.Vector3()).negate(), orbWorldPos);
    prevCursorWorldPos.copy(orbWorldPos);
    grabbedOrb.userData.currentVelocity.set(0, 0, 0);
  }
  if (isDragging) {
    raycaster.setFromCamera(mouse, orbitControls.object);
    if (raycaster.ray.intersectPlane(dragPlane, cursorWorldPos)) {
      const localPos = cursorWorldPos.clone();
      skillsGroup.worldToLocal(localPos);
      grabbedOrb.position.copy(localPos);
      grabbedOrb.userData.currentVelocity.lerp(cursorWorldPos.clone().sub(prevCursorWorldPos).multiplyScalar(60), 0.5);
      prevCursorWorldPos.copy(cursorWorldPos);
    }
  }
}

function onPointerUp(event) {
  if (grabbedOrb) {
    const moved = Math.hypot(event.clientX - startMouse.x, event.clientY - startMouse.y);
    if (moved < dragThreshold && infoCardRef && grabbedOrb.userData.skillData) {
      const data = grabbedOrb.userData.skillData;
      infoCardRef.show({ title: data.name, years: data.years || "Skill Proficiency", description: data.description || "Expertise and application." });
    }
    if (isDragging) orbitControls.enabled = true;
  }
  grabbedOrb = null; isDragging = false;
}

export function updateSkills(camera) {
  if (!skillsGroup) return;
  const time = performance.now() * 0.001;
  skillsGroup.rotation.y = time * 0.15;
  let cursorInWorld = null;
  if (isMouseOver) {
    raycaster.setFromCamera(mouse, camera);
    if (raycaster.ray.intersectPlane(groundPlane, cursorWorldPos)) { cursorInWorld = cursorWorldPos.clone(); cursorInWorld.y = 10; }
  }

  skillsGroup.children.forEach(child => {
    if (child.userData.isDome) child.lookAt(camera.position);
    if (child.userData.isGroundRing) {
      child.material.opacity = child.userData.baseOpacity * (0.35 + Math.sin(time * 1.5) * 0.2);
      child.scale.setScalar(child.userData.baseScale * (0.98 + Math.sin(time * 1.7 + 1) * 0.04));
    }
    if (child.userData.isUpwardLights) {
      const ud = child.userData, pos = ud.positions, alphas = ud.alphas, speeds = ud.speeds;
      const intensity = 0.7 + Math.sin(time * 1.8) * 0.3;
      for (let i = 0; i < upwardParticleCount; i++) {
        pos[i * 3 + 1] += speeds[i] * 0.016;
        if (pos[i * 3 + 1] > ud.baseY + upwardMaxHeight) {
          const a = Math.random() * Math.PI * 2, r = domeRadius * (0.7 + Math.random() * 0.35);
          pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 2] = Math.sin(a) * r; pos[i * 3 + 1] = ud.baseY + Math.random() * 40; alphas[i] = 0;
        }
        alphas[i] = Math.min(1.0, Math.sin(((pos[i * 3 + 1] - ud.baseY) / upwardMaxHeight) * Math.PI)) * intensity;
      }
      child.geometry.attributes.position.needsUpdate = true; child.geometry.attributes.alpha.needsUpdate = true;
    }
    if (child.userData.cloud) {
      const ud = child.userData;
      if (grabbedOrb !== child) {
        const toHome = ud.originalOrbitalPos.clone().sub(child.position);
        ud.currentVelocity.add(toHome.multiplyScalar(0.08)).multiplyScalar(0.88);
        child.position.add(ud.currentVelocity.clone().multiplyScalar(0.016));
        if (child.position.length() > innerRadius) { child.position.normalize().multiplyScalar(innerRadius); ud.currentVelocity.multiplyScalar(0.5); }
        child.position.y += Math.sin(time * 1.2 + ud.timeOffset) * 0.7;
      }
      if (ud.textParticles.userData.billboard) ud.textParticles.lookAt(camera.position);
      raycaster.setFromCamera(mouse, camera);
      const hovered = raycaster.intersectObject(child, true).length > 0 && grabbedOrb !== child;
      ud.cloudMaterial.uniforms.uOpacity.value += ((hovered ? ud.hoverOpacity : ud.baseOpacity) - ud.cloudMaterial.uniforms.uOpacity.value) * 0.12;
      ud.textMaterial.uniforms.uOpacity.value += ((hovered ? ud.hoverOpacity : ud.baseOpacity) - ud.textMaterial.uniforms.uOpacity.value) * 0.12;
      ud.glowHalo.material.opacity = 0.12 + (hovered ? 0.35 : 0);
      child.scale.lerp(new THREE.Vector3(hovered ? ud.hoverScale : ud.baseScale, hovered ? ud.hoverScale : ud.baseScale, hovered ? ud.hoverScale : ud.baseScale), 0.15);
      
      const cloudP = ud.cloud.geometry.attributes.position.array;
      if (hovered && cursorInWorld) {
        child.updateMatrixWorld();
        const lCurs = cursorInWorld.clone().applyMatrix4(child.matrixWorld.clone().invert());
        for (let i = 0; i < cloudP.length; i += 3) {
          let vx = ud.velocities[i], vy = ud.velocities[i+1], vz = ud.velocities[i+2];
          vx += (ud.homePositions[i] - cloudP[i]) * 0.025; vy += (ud.homePositions[i+1] - cloudP[i+1]) * 0.025; vz += (ud.homePositions[i+2] - cloudP[i+2]) * 0.025;
          const dx = cloudP[i] - lCurs.x, dy = cloudP[i+1] - lCurs.y, dz = cloudP[i+2] - lCurs.z, dSq = dx*dx + dy*dy + dz*dz;
          if (dSq < 4225 && dSq > 1) { const dist = Math.sqrt(dSq), f = 10 * (1 - dist / 65); vx += (dx/dist)*f; vy += (dy/dist)*f; vz += (dz/dist)*f; }
          ud.velocities[i] = vx * 0.45; ud.velocities[i+1] = vy * 0.45; ud.velocities[i+2] = vz * 0.45;
          cloudP[i] += ud.velocities[i]; cloudP[i+1] += ud.velocities[i+1]; cloudP[i+2] += ud.velocities[i+2];
        }
      } else {
        for (let i = 0; i < cloudP.length; i += 3) { cloudP[i] += (ud.homePositions[i] - cloudP[i]) * 0.02; cloudP[i+1] += (ud.homePositions[i+1] - cloudP[i+1]) * 0.02; cloudP[i+2] += (ud.homePositions[i+2] - cloudP[i+2]) * 0.02; }
      }
      ud.cloud.geometry.attributes.position.needsUpdate = true;
    }
  });
}