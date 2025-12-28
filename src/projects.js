// src/projects.js
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

let titleGroup = null;
let portalTrigger = null; 
const fontLoader = new FontLoader();
const fontURL = 'https://cdn.jsdelivr.net/npm/three@0.168.0/examples/fonts/helvetiker_bold.typeface.json';

let currentProjectIndex = -1;
let projectList = [];
let originalCameraPos = new THREE.Vector3();
let originalTarget = new THREE.Vector3();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

export function createProjectsArea(scene) {
  titleGroup = new THREE.Group();
  titleGroup.position.set(1500, 10, -150);
  titleGroup.rotation.y = THREE.MathUtils.degToRad(-30);
  scene.add(titleGroup);

  fontLoader.load(fontURL, (font) => {
    const text = "PERSONAL PROJECTS";
    const letters = text.split('');
    const totalWidth = 1500;
    const validCount = letters.filter(c => c !== ' ').length;
    const spacing = (totalWidth / (validCount + 1)) * 0.75;
    
    let i = 0;
    const forwardOffset = 300;

    letters.forEach(char => {
      if (char === ' ') return;
      const geo = new TextGeometry(char, {
        font, size: 48, depth: 18, curveSegments: 12,
        bevelEnabled: true, bevelThickness: 5, bevelSize: 3, bevelSegments: 8
      });
      geo.computeBoundingBox();
      const offset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
      geo.translate(offset, 0, 0);

      const material = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0x00ffff, emissiveIntensity: 2.0, metalness: 0.8, roughness: 0.1
      });

      const letter = new THREE.Mesh(geo, material);
      letter.position.set(100 + (-totalWidth / 2 + (i + 1) * spacing), 300 + Math.random() * 250, forwardOffset + (Math.random() - 0.5) * 100);
      letter.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);

      letter.userData = {
        velocity: new THREE.Vector3((Math.random() - 0.5) * 80, -180 - Math.random() * 180, (Math.random() - 0.5) * 80),
        rotVel: new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4),
        landed: false, targetY: -80, targetZ: forwardOffset, targetX: letter.position.x
      };

      titleGroup.add(letter);
      i++;
    });

    const glow = new THREE.Mesh(
      new THREE.RingGeometry(400, 600, 64),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(0, -79.9, forwardOffset);
    titleGroup.add(glow);

    createHolographicPortal(titleGroup);
  });

  return titleGroup;
}

function createHolographicPortal(parent) {
    const portalGroup = new THREE.Group();
    portalGroup.name = "startTourButton";
    portalGroup.position.set(0, 100, 350);
    parent.add(portalGroup);
    portalTrigger = portalGroup;

    const createArc = (radius, start, end, opacity = 0.6) => {
        const points = [];
        for (let i = start; i <= end; i += 5) {
            const rad = (i * Math.PI) / 180;
            points.push(new THREE.Vector3(Math.cos(rad) * radius, Math.sin(rad) * radius, 0));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity });
        return new THREE.Line(geometry, material);
    };

    const r1 = createArc(120, 0, 180, 0.8);
    const r2 = createArc(120, 200, 340, 0.8);
    const r3 = createArc(145, 45, 135, 0.4);
    const r4 = createArc(145, 225, 315, 0.4);
    
    const coreGeo = new THREE.SphereGeometry(85, 32, 32);
    const coreMat = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5,
        transparent: true, opacity: 0.5, shininess: 100
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.name = "portal_core";

    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px Arial';
    ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
    ctx.fillText('CLICK FOR', 256, 110);
    ctx.fillText('DETAILS', 256, 170);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.MeshBasicMaterial({ 
        map: labelTex, transparent: true, opacity: 0, 
        blending: THREE.AdditiveBlending, depthTest: false 
    });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(140, 70), labelMat);
    labelMesh.name = "portal_hover_label";
    labelMesh.position.z = 5; 

    portalGroup.add(r1, r2, r3, r4, core, labelMesh);
    portalGroup.userData = { isHovered: false };

    new TWEEN.Tween(portalGroup.scale)
        .to({ x: 1.05, y: 1.05, z: 1.05 }, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut).yoyo(true).repeat(Infinity).start();
}

export function setupProjectNavigation(camera, controls, projects) {
    projectList = projects;
    const navDiv = document.createElement('div');
    navDiv.id = "proj-nav-ui";
    navDiv.style.cssText = `position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; z-index: 10000; opacity: 0; transition: opacity 0.5s; pointer-events: none;`;
    const btnStyle = `padding: 12px 20px; background: rgba(0, 20, 40, 0.9); border: 2px solid #00ffff; color: #00ffff; cursor: pointer; font-family: monospace; font-weight: bold;`;
    navDiv.innerHTML = `<button id="prevBtn" style="${btnStyle}"> < PREV </button><button id="exitBtn" style="${btnStyle} border-color: #ff3366; color: #ff3366;"> EXIT VIEW </button><button id="nextBtn" style="${btnStyle}"> NEXT > </button>`;
    document.body.appendChild(navDiv);

    const showProject = (index) => {
        const project = projectList[index].group;
        const worldPos = new THREE.Vector3();
        project.getWorldPosition(worldPos);
        animateCamera(camera, controls, worldPos.clone().add(new THREE.Vector3(0, 250, 750)), worldPos.clone().add(new THREE.Vector3(0, 250, 0)));
    };

    window.focusProjects = () => {
        originalCameraPos.copy(camera.position); originalTarget.copy(controls.target);
        navDiv.style.opacity = "1"; navDiv.style.pointerEvents = "all";
        showProject(0); currentProjectIndex = 0;
    };

    window.addEventListener('pointermove', (event) => {
        if (!portalTrigger) return;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        const core = portalTrigger.getObjectByName("portal_core");
        const intersects = raycaster.intersectObject(core);
        const isCurrentlyHovered = intersects.length > 0;

        if (isCurrentlyHovered && !portalTrigger.userData.isHovered) {
            portalTrigger.userData.isHovered = true;
            document.body.style.cursor = 'pointer';
            const label = portalTrigger.getObjectByName("portal_hover_label");
            new TWEEN.Tween(core.material).to({ opacity: 0.9, emissiveIntensity: 2.5 }, 300).start();
            new TWEEN.Tween(label.material).to({ opacity: 1.0 }, 300).start();
        } else if (!isCurrentlyHovered && portalTrigger.userData.isHovered) {
            portalTrigger.userData.isHovered = false;
            document.body.style.cursor = 'default';
            const label = portalTrigger.getObjectByName("portal_hover_label");
            new TWEEN.Tween(core.material).to({ opacity: 0.5, emissiveIntensity: 0.5 }, 300).start();
            new TWEEN.Tween(label.material).to({ opacity: 0 }, 300).start();
        }
    });

    window.addEventListener('click', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(titleGroup.children, true);
        for (let obj of intersects) {
            if (obj.object.name === "portal_core" || obj.object.name === "portal_hover_label") {
                window.focusProjects(); break;
            }
        }
    });

    document.getElementById('nextBtn').onclick = () => { currentProjectIndex = (currentProjectIndex + 1) % projectList.length; showProject(currentProjectIndex); };
    document.getElementById('prevBtn').onclick = () => { currentProjectIndex = (currentProjectIndex - 1 + projectList.length) % projectList.length; showProject(currentProjectIndex); };
    document.getElementById('exitBtn').onclick = () => { navDiv.style.opacity = "0"; navDiv.style.pointerEvents = "none"; animateCamera(camera, controls, originalCameraPos, originalTarget); };
}

function animateCamera(camera, controls, targetPos, targetLookAt) {
    new TWEEN.Tween(camera.position).to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1200).easing(TWEEN.Easing.Quadratic.InOut).start();
    new TWEEN.Tween(controls.target).to({ x: targetLookAt.x, y: targetLookAt.y, z: targetLookAt.z }, 1200).easing(TWEEN.Easing.Quadratic.InOut).onUpdate(() => controls.update()).start();
}

export function updateTitleLetters(delta) {
  if (!titleGroup || !portalTrigger) return;

  const isHovered = portalTrigger.userData.isHovered;
  const spinSpeed = isHovered ? 6.0 : 0.8;
  
  portalTrigger.children.forEach(child => {
      if (child.type === "Line") {
          child.rotation.z += delta * spinSpeed * (child.geometry.index ? 1 : -1);
      }
  });

  titleGroup.children.forEach(obj => {
    if (!obj.userData.velocity || obj.userData.landed) return;
    const u = obj.userData;
    u.velocity.y -= 1600 * delta;
    obj.position.addScaledVector(u.velocity, delta);
    obj.rotation.x += u.rotVel.x; obj.rotation.y += u.rotVel.y; obj.rotation.z += u.rotVel.z;
    if (obj.position.y <= u.targetY) {
      obj.position.set(u.targetX, u.targetY, u.targetZ);
      obj.rotation.set(THREE.MathUtils.degToRad(-12), 0, 0);
      u.landed = true;
      obj.material.emissiveIntensity = 4.0;
      new TWEEN.Tween(obj.scale).to({ x: 1.6, y: 1.6, z: 1.6 }, 180).easing(TWEEN.Easing.Elastic.Out).yoyo(true).repeat(1).start().onComplete(() => obj.material.emissiveIntensity = 2.0);
    }
  });
}

export class PersonalProject {
    constructor({ title, description, tech = [], link = "" }, pos = new THREE.Vector3(), spacingMultiplier = 1.0) {
      this.group = new THREE.Group();
      this.group.position.copy(pos);
      this.group.scale.set(spacingMultiplier, spacingMultiplier, spacingMultiplier);

      const canvas = document.createElement('canvas');
      canvas.width = 1408; canvas.height = 1056;
      const ctx = canvas.getContext('2d');
      
      // Screen Background
      ctx.fillStyle = 'rgba(8, 15, 35, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Scanlines effect
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 10) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Border
      ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 20; ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);
      
      // Title
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 104px Arial'; ctx.textAlign = 'center';
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 30;
      this._wrapText(ctx, title, canvas.width / 2, 170, 1240, 120);
      
      // Description
      ctx.font = '54px Arial'; ctx.fillStyle = '#aaffff'; ctx.shadowBlur = 18;
      this._wrapText(ctx, description, canvas.width / 2, 330, 1240, 78);

      // RESTORED: Tech Stack
      if (tech.length) {
        ctx.font = '50px Arial';
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 20;
        this._wrapText(ctx, "Tech: " + tech.join(' • '), canvas.width / 2, 700, 1240, 68);
      }
  
      // RESTORED: Link
      if (link) {
        ctx.fillStyle = '#aaffaa';
        ctx.font = 'italic 52px Arial';
        ctx.shadowBlur = 20;
        this._wrapText(ctx, link, canvas.width / 2, 880, 1240, 68);
      }
      
      requestAnimationFrame(() => {
        const tex = new THREE.CanvasTexture(canvas);
        const screenMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.98, side: THREE.DoubleSide });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(570, 427.5), screenMat);
        screen.position.y = 250; this.group.add(screen);
        
        // Glow Backplane
        const glowBack = new THREE.Mesh(new THREE.PlaneGeometry(600, 457.5), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending }));
        glowBack.position.set(0, 250, -12); this.group.add(glowBack);
      });
  
      const base = new THREE.Mesh(new THREE.CylinderGeometry(90, 120, 25, 32), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 }));
      base.position.y = -10; this.group.add(base);
    }
  
    _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(' '); let line = ''; let cy = y;
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > maxWidth && line !== '') {
          ctx.fillText(line.trim(), x, cy); line = word + ' '; cy += lineHeight;
        } else { line = testLine; }
      }
      ctx.fillText(line.trim(), x, cy);
    }
    addTo(area) { area.add(this.group); return this; }
    update(camera) { this.group.lookAt(camera.position); this.group.rotation.x = 0; this.group.rotation.z = 0; }
}