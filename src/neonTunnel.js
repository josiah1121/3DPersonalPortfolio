// src/neonTunnel.js (lower height + random vibrant accents + center floor glow lines — fully static)
import * as THREE from 'three';

export function createNeonTunnel(scene) {
  const tunnelGroup = new THREE.Group();

  const numFrames = 60;
  const startDistance = 4000;
  const depthStep = 600;
  const beamHeight = 3000;          // Low height as requested
  const initialOffset = 10000;      // Very wide base
  const slantFactor = 0.75;
  const thickness = 70;
  const accentThickness = 40;       // Slightly thinner accents
  const accentOffset = 150;         // How far accents are offset from main beams

  const colorA = new THREE.Color(0x00ffff); // Cyan/blue
  const colorB = new THREE.Color(0xff00ff); // Magenta/purple
  // Brighter accent colors
  const accentColorA = new THREE.Color(0x00ffff).multiplyScalar(1.5);
  const accentColorB = new THREE.Color(0xff00ff).multiplyScalar(1.5);

  let currentOffset = initialOffset;

  // Main structure loop
  for (let i = 0; i < numFrames; i++) {
    const zPos = - (startDistance + i * depthStep);
    const scale = 1 - (i * 0.008);

    const leftBottom  = new THREE.Vector3(-currentOffset, 0, 0);
    const rightBottom = new THREE.Vector3( currentOffset, 0, 0);
    const leftTop     = new THREE.Vector3(-currentOffset * 0.6, beamHeight, 0);
    const rightTop    = new THREE.Vector3( currentOffset * 0.6, beamHeight, 0);

    const mainBeams = [
      [leftBottom, leftTop],
      [rightBottom, rightTop],
      [leftTop, rightTop] // top connector
    ];

    // Add main beams
    mainBeams.forEach(beam => addTube(beam[0], beam[1], (i % 2 === 0) ? colorA : colorB, thickness, zPos, scale));

    // Randomly add vibrant accent beams (approx 40% chance per frame)
    if (Math.random() < 0.4) {
      const numAccents = Math.floor(Math.random() * 2) + 1; // 1 or 2 accents
      const accentColor = (i % 2 === 0) ? accentColorA : accentColorB;

      for (let a = 0; a < numAccents; a++) {
        const randomBeamIndex = Math.floor(Math.random() * mainBeams.length);
        const originalBeam = mainBeams[randomBeamIndex];
        const offsetDir = new THREE.Vector3().subVectors(originalBeam[1], originalBeam[0]).cross(new THREE.Vector3(0,0,1)).normalize();

        const accentStart = originalBeam[0].clone().add(offsetDir.clone().multiplyScalar(accentOffset * (Math.random() > 0.5 ? 1 : -1)));
        const accentEnd   = originalBeam[1].clone().add(offsetDir.clone().multiplyScalar(accentOffset * (Math.random() > 0.5 ? 1 : -1)));

        addTube(accentStart, accentEnd, accentColor, accentThickness, zPos, scale, 1.0); // full opacity for extra vibrancy
      }
    }

    currentOffset -= initialOffset * slantFactor / numFrames;
  }

  // Helper to create a tube
  function addTube(start, end, color, thick, z, scale, opacity = 0.95) {
    const curve = new THREE.LineCurve3(start, end);
    const tubeGeo = new THREE.TubeGeometry(curve, 8, thick / 2, 12, false);
    const tubeMat = new THREE.MeshBasicMaterial({
      color: color,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: opacity,
      depthWrite: false
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.position.z = z;
    tube.scale.setScalar(scale);
    tunnelGroup.add(tube);
  }

    // === Center floor glow lines === (now properly on the ground)
    const floorLinesGroup = new THREE.Group();

    const floorLineLength = 50000;     // Long enough to vanish in fog
    const floorStartZ = -500;          // Starts close to camera
    const floorEndZ = floorStartZ - floorLineLength;

    // Height relative to your ground plane (which is at y = -80)
    const groundY = -80;
    const floorLinesHeight = groundY + 1;  // <<< Adjust this offset only!
                                            // 0 = exactly on ground (may flicker)
                                            // 1–5 = slight hover with perfect reflection
                                            // Try: groundY + 1  →  groundY + 3

    // Central bright white-ish line
    addFloorLine(0, 0xffffff, 80);

    // Flanking colored lines
    addFloorLine(-400, 0x00ffff, 40);
    addFloorLine(400, 0xff00ff, 40);

    function addFloorLine(xOffset, colorHex, thick) {
        const start = new THREE.Vector3(xOffset, floorLinesHeight, floorStartZ);
        const end   = new THREE.Vector3(xOffset, floorLinesHeight, floorEndZ);

        const curve = new THREE.LineCurve3(start, end);
        const geo = new THREE.TubeGeometry(curve, 64, thick / 2, 8, false);
        const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.85,
        depthWrite: false
        });
        const line = new THREE.Mesh(geo, mat);
        floorLinesGroup.add(line);
    }

  tunnelGroup.add(floorLinesGroup);

  scene.add(tunnelGroup);

  function updateNeonTunnel() {
    // Static — no animation
  }

  return { tunnelGroup, updateNeonTunnel };
}