// src/components/infoCard.js
import * as THREE from 'three';

export function createInfoCard(scene, camera) {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);

  // 1. IMPROVED DIMMING OVERLAY
  const overlayGeo = new THREE.PlaneGeometry(100, 100); 
  const overlayMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    depthTest: false, 
    depthWrite: false,
  });
  const overlay = new THREE.Mesh(overlayGeo, overlayMat);
  overlay.renderOrder = 998; 
  group.add(overlay);

  // 2. BACKDROP (Glow behind card)
  const backdropGeo = new THREE.CircleGeometry(10, 64);
  const backdropMat = new THREE.MeshBasicMaterial({
    color: 0x002266,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthTest: false,
  });
  const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
  backdrop.renderOrder = 999;
  group.add(backdrop);

  // 3. CANVAS & CARD
  const canvas = document.createElement('canvas');
  canvas.width = 1800;   
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const cardMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthTest: false,
  });

  const cardGeo = new THREE.PlaneGeometry(16, 9.8); 
  const cardMesh = new THREE.Mesh(cardGeo, cardMat);
  cardMesh.renderOrder = 1000; 
  group.add(cardMesh);

  let targetOpacity = 0;
  let currentOpacity = 0;
  let targetScale = 0.8;
  let currentScale = 0.8;

  function drawCard(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(10, 20, 50, 0.95)');
    grad.addColorStop(1, 'rgba(5, 10, 30, 0.98)');
    ctx.fillStyle = grad;
    roundRect(ctx, 20, 20, canvas.width - 40, canvas.height - 40, 60);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#55aaff';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Content
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    
    // Title
    ctx.font = 'bold 120px Arial';
    ctx.fillText(data.title, canvas.width / 2, 200);

    // Years
    ctx.font = 'italic 70px Arial';
    ctx.fillStyle = '#88ccff';
    ctx.fillText(data.years, canvas.width / 2, 300);

    // Description
    ctx.font = '55px Arial';
    ctx.fillStyle = '#eef6ff';
    wrapText(ctx, data.description || '', canvas.width / 2, 450, canvas.width * 0.8, 75);

    // --- CLEAN ESC HINT LOGIC ---
    const hintY = canvas.height - 110;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#88ccff';
    ctx.strokeStyle = '#88ccff';
    
    const fontMain = '40px Arial';
    const fontKey = 'bold 30px Arial';
    
    const text1 = "Press ";
    const text2 = " to dismiss";
    const keyText = "ESC";

    // Measure widths for layout
    ctx.font = fontMain;
    const w1 = ctx.measureText(text1).width;
    const w2 = ctx.measureText(text2).width;
    
    const boxW = 100;
    const boxH = 55;
    const spacing = 15; // Space between text and box
    
    // Total width of the combined hint
    const totalW = w1 + boxW + w2 + (spacing * 2);
    let currentX = (canvas.width - totalW) / 2;

    // 1. Draw "Press"
    ctx.textAlign = 'left';
    ctx.fillText(text1, currentX, hintY);
    currentX += w1 + spacing;

    // 2. Draw ESC Box
    const boxY = hintY - 38;
    ctx.lineWidth = 3;
    roundRect(ctx, currentX, boxY, boxW, boxH, 10);
    ctx.stroke();
    
    // 3. Draw "ESC" inside box
    ctx.font = fontKey;
    ctx.textAlign = 'center';
    ctx.fillText(keyText, currentX + boxW / 2, hintY - 3);
    currentX += boxW + spacing;

    // 4. Draw "to dismiss"
    ctx.font = fontMain;
    ctx.textAlign = 'left';
    ctx.fillText(text2, currentX, hintY);
    
    ctx.globalAlpha = 1.0; 
    // -----------------------

    texture.needsUpdate = true;
  }

  function wrapText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (context.measureText(testLine).width > maxWidth && n > 0) {
        context.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else { line = testLine; }
    }
    context.fillText(line.trim(), x, currentY);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  function show(cardData) {
    drawCard(cardData);
    group.visible = true;
    targetOpacity = 1;
    targetScale = 1.0;
  }

  function hide() {
    targetOpacity = 0;
    targetScale = 0.9;
  }

  function update() {
    currentOpacity += (targetOpacity - currentOpacity) * 0.12;
    currentScale += (targetScale - currentScale) * 0.12;

    const dist = 10; 
    group.position.copy(camera.position);
    group.quaternion.copy(camera.quaternion);
    group.translateZ(-dist);

    overlay.scale.set(5, 5, 1); 
    overlayMat.opacity = currentOpacity * 0.85; 
    backdropMat.opacity = currentOpacity * 0.5;
    cardMat.opacity = currentOpacity;
    
    cardMesh.scale.setScalar(currentScale);
    backdrop.scale.setScalar(currentScale * 1.5);

    if (currentOpacity < 0.01 && targetOpacity === 0) {
      group.visible = false;
    }
  }

  const escListener = (e) => { if (e.key === 'Escape') hide(); };
  window.addEventListener('keydown', escListener);

  return {
    group,
    show,
    hide,
    update,
    dispose: () => {
      window.removeEventListener('keydown', escListener);
      [overlayGeo, overlayMat, backdropGeo, backdropMat, cardGeo, cardMat, texture].forEach(r => r.dispose());
      scene.remove(group);
    }
  };
}