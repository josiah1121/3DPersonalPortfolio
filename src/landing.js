import * as THREE from 'three';
import TWEEN from 'https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js';

export function createLandingPage(scene, camera, onEnter) {
  const group = new THREE.Group();
  scene.add(group);

  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const isSmallScreen = window.innerWidth < 600;
  
  const mobileScale = (isTouch || isSmallScreen) ?  3.0 : 1.0;

  if (!isTouch) document.body.style.cursor = 'none';
  group.scale.set(mobileScale, mobileScale, mobileScale);

  let rotationMultiplier = 1;
  let isEntering = false; 

  const createArc = (radius, start, end, color, opacity = 0.6) => {
    const points = [];
    for (let i = start; i <= end; i += 2) {
      const rad = (i * Math.PI) / 180;
      points.push(new THREE.Vector3(Math.cos(rad) * radius, Math.sin(rad) * radius, 0));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new THREE.Line(geometry, material);
    line.userData.originalColor = new THREE.Color(color);
    return line;
  };

  const layer1 = createArc(180, 0, 90, 0x00ffff); 
  const layer2 = createArc(180, 120, 240, 0x00ffff);
  const layer3 = createArc(195, 45, 135, 0x88ccff, 0.3); 
  const layer4 = createArc(195, 225, 315, 0x88ccff, 0.3);
  
  const dotsGeo = new THREE.RingGeometry(160, 161, 64);
  const dotsMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.2, wireframe: true });
  const dots = new THREE.Mesh(dotsGeo, dotsMat);

  const shieldGeo = new THREE.CircleGeometry(200, 32);
  const shieldMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.name = "portal_trigger";

  group.add(layer1, layer2, layer3, layer4, dots, shield);

  // 2. POSITION ADJUSTMENT:
  // Move it slightly closer on mobile (-400 instead of -500) to combat perspective shrinkage
  const zPos = (isTouch || isSmallScreen) ? -400 : -500;
  group.position.set(0, 0, zPos);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let isHovered = false;

  const triggerActivation = () => {
    isHovered = true;
    if (!isTouch) document.body.style.cursor = 'pointer'; 
    
    new TWEEN.Tween(group.scale).to({ x: mobileScale * 1.15, y: mobileScale * 1.15 }, 400).easing(TWEEN.Easing.Back.Out).start();
    new TWEEN.Tween({ val: rotationMultiplier }).to({ val: 3 }, 400)
      .onUpdate((obj) => { rotationMultiplier = obj.val; }).start();

    [layer1, layer2, layer3, layer4].forEach(l => {
      new TWEEN.Tween(l.material.color).to({ r: 1, g: 1, b: 1 }, 400).start();
      new TWEEN.Tween(l.material).to({ opacity: 1 }, 400).start();
    });
    new TWEEN.Tween(dots.material).to({ opacity: 0.8 }, 400).start();
  };

  const triggerDeactivation = () => {
    isHovered = false;
    if (!isTouch) document.body.style.cursor = 'none';
    
    new TWEEN.Tween(group.scale).to({ x: mobileScale, y: mobileScale }, 400).start();
    new TWEEN.Tween({ val: rotationMultiplier }).to({ val: 1 }, 400)
      .onUpdate((obj) => { rotationMultiplier = obj.val; }).start();

    [layer1, layer2, layer3, layer4].forEach(l => {
      const orig = l.userData.originalColor;
      new TWEEN.Tween(l.material.color).to({ r: orig.r, g: orig.g, b: orig.b }, 400).start();
      new TWEEN.Tween(l.material).to({ opacity: 0.6 }, 400).start();
    });
    new TWEEN.Tween(dots.material).to({ opacity: 0.2 }, 400).start();
  };

  const onMove = (e) => {
    if (isEntering || isTouch) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObject(shield);

    if (hit.length > 0 && !isHovered) triggerActivation();
    else if (hit.length === 0 && isHovered) triggerDeactivation();
  };

  const onClick = (e) => {
    if (isEntering) return;

    if (isTouch) {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      mouse.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.intersectObject(shield);
      
      if (hit.length > 0) {
        triggerActivation();
        // Short delay on mobile so the user sees the "activation" before the zoom
        setTimeout(startTransition, 150); 
      }
    } else {
      if (isHovered) startTransition();
    }
  };

  const startTransition = () => {
    isEntering = true; 
    const overlay = document.getElementById('landing-overlay');
    if (overlay) overlay.classList.add('fade-out');

    new TWEEN.Tween(group.scale).to({ x: 20, y: 20, z: 20 }, 1500).easing(TWEEN.Easing.Exponential.In).start();
    new TWEEN.Tween(group.rotation).to({ z: Math.PI * 4 }, 1500).easing(TWEEN.Easing.Quadratic.In).start();
    
    group.children.forEach(child => {
      if(child.material) new TWEEN.Tween(child.material).to({ opacity: 0 }, 800).start();
    });

    setTimeout(() => {
      scene.remove(group);
      onEnter();
      if (overlay) overlay.style.display = 'none';
      cleanup();
    }, 1500);
  };

  const cleanup = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerdown', onClick);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerdown', onClick);

  return {
    update: (time) => {
      const speed = time * rotationMultiplier;
      layer1.rotation.z = speed * 0.4;
      layer2.rotation.z = speed * 0.4;
      layer3.rotation.z = -speed * 0.2;
      layer4.rotation.z = -speed * 0.2;
      dots.rotation.z = -speed * 0.1;
    },
    cleanup
  };
}