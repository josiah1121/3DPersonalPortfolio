import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

describe('index.html structure', () => {
  // Read the actual file from the root directory
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;

  it('has the correct title', () => {
    expect(document.title).toBe('Josiah Clark - Personal Portfolio');
  });

  it('contains the essential viewport meta tag for mobile responsiveness', () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    expect(viewport.getAttribute('content')).toContain('width=device-width');
  });

  it('includes the style.css link', () => {
    const link = document.querySelector('link[rel="stylesheet"]');
    expect(link.getAttribute('href')).toBe('style.css');
  });

  it('defines the Three.js importmap correctly', () => {
    const importMap = document.querySelector('script[type="importmap"]');
    expect(importMap).not.toBeNull();
    
    const mapContent = JSON.parse(importMap.textContent);
    expect(mapContent.imports.three).toContain('three.module.js');
    expect(mapContent.imports['three/addons/']).toBeDefined();
  });

  it('loads main.js as a module', () => {
    const mainScript = document.querySelector('script[src="main.js"]');
    expect(mainScript).not.toBeNull();
    expect(mainScript.getAttribute('type')).toBe('module');
  });
});