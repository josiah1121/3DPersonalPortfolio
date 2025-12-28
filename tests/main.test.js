import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';

// --- NEW MOCK: Resolve the landing.js dependency ---
vi.mock('../src/landing.js', () => ({
  createLandingPage: vi.fn((scene, camera, onEnter) => ({
    update: vi.fn(),
    cleanup: vi.fn(),
    // We can manually trigger onEnter in tests if we want to simulate the user entering
    triggerEnter: onEnter 
  }))
}));

// 1. Mock all module dependencies to isolate the main.js logic
vi.mock('../src/scene.js', () => ({
  initScene: vi.fn(() => ({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    renderer: { 
      render: vi.fn(), 
      domElement: document.createElement('canvas'),
      setSize: vi.fn() 
    },
    controls: { update: vi.fn() }
  }))
}));

vi.mock('../src/cursor.js', () => ({ 
  setupCursor: vi.fn(() => ({ activate: vi.fn(), update: vi.fn() })),
  mouse: { x: 0, y: 0 }
}));

vi.mock('../src/stars.js', () => ({ initShootingStars: vi.fn(), updateShootingStars: vi.fn() }));

vi.mock('../src/particles.js', () => ({ 
  default: { createParticles: vi.fn((s, t, cfg) => { if(cfg?.onComplete) cfg.onComplete(); }), updateParticles: vi.fn() } 
}));

vi.mock('../src/glowText.js', () => ({ createGlowText: vi.fn(), updateGlowText: vi.fn() }));
vi.mock('../src/player.js', () => ({ createPlayer: vi.fn(() => ({ update: vi.fn() })) }));
vi.mock('../src/dust.js', () => ({ initDust: vi.fn(), updateDust: vi.fn() }));

vi.mock('../src/projects.js', () => ({
  createProjectsArea: vi.fn(() => {
    const g = new THREE.Group();
    g.visible = true; // Default to true so we can test main.js hiding it
    return g;
  }),
  updateTitleLetters: vi.fn(),
  // ADD THIS: Mock the navigation setup function
  setupProjectNavigation: vi.fn((camera, controls, projects) => {
    // Return a mock or just let it be a spy
    return;
  }),
  PersonalProject: vi.fn().mockImplementation(function() {
    return {
      addTo: vi.fn(),
      update: vi.fn()
    };
  })
}));

vi.mock('../src/experience.js', () => ({
  createExperienceArea: vi.fn(() => ({ group: new THREE.Group(), infoCard: { update: vi.fn() } })),
  updateExperience: vi.fn(),
  handlePointerDown: vi.fn(),
  handlePointerUp: vi.fn()
}));

vi.mock('../src/skills.js', () => ({
  createSkillsArea: vi.fn(() => new THREE.Group()),
  updateSkills: vi.fn(),
  setOrbitControls: vi.fn(),
  setInfoCard: vi.fn()
}));

vi.mock('../src/skillsTitle.js', () => ({ createSkillsTitle: vi.fn(), updateSkillsTitle: vi.fn() }));
vi.mock('../src/experienceTitle.js', () => ({ createExperienceTitle: vi.fn(), updateExperienceTitle: vi.fn() }));

vi.mock('../src/neonTunnel.js', () => ({ 
  createNeonTunnel: vi.fn(() => ({ tunnelGroup: new THREE.Group(), updateNeonTunnel: vi.fn() })) 
}));

// Mock the CDN import specifically
vi.mock('https://cdn.jsdelivr.net/npm/@tweenjs/tween.js@23/dist/tween.esm.js', () => ({
  default: { 
    update: vi.fn(),
    Tween: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      easing: vi.fn().mockReturnThis(),
      onUpdate: vi.fn().mockReturnThis(),
      start: vi.fn().mockReturnThis()
    }))
  }
}));

describe('Main Application Entry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules(); 
    vi.clearAllMocks(); 
    
    // Mock requestAnimationFrame to prevent it from hanging or erroring in JSDOM
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => setTimeout(cb, 16));
    
    // Setup body for overlay checks
    document.body.innerHTML = '<div id="landing-overlay"></div>';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('initializes the core engine and starts the animation loop', async () => {
    await import('../main.js');
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('initially hides world areas before landing is completed', async () => {
    const { createProjectsArea } = await import('../src/projects.js');
    await import('../main.js');
    
    const projectsGroup = vi.mocked(createProjectsArea).mock.results[0].value;
    expect(projectsGroup.visible).toBe(false);
    expect(window.isStarted).toBe(false);
  });

  it('calculates the tight arc positions for the 5 projects', async () => {
    const { PersonalProject } = await import('../src/projects.js');
    await import('../main.js');

    expect(PersonalProject).toHaveBeenCalledTimes(5);

    const firstProjectCall = vi.mocked(PersonalProject).mock.calls[0];
    const positionArg = firstProjectCall[1]; 

    // radius is 1500, zOffset is 1000. Expected z ~ -cos(angle)*1500 + 1000
    expect(positionArg.z).toBeLessThanOrEqual(1000); 
  });

  it('sets up global pointer event listeners for experience interaction', async () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');
    await import('../main.js');

    expect(addEventSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(addEventSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });

  it('bridges the InfoCard between Experience and Skills modules', async () => {
    const { setInfoCard } = await import('../src/skills.js');
    await import('../main.js');

    expect(setInfoCard).toHaveBeenCalled();
  });
});