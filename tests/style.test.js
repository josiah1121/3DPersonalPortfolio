import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('style.css configuration', () => {
  // Read the CSS file content
  const css = fs.readFileSync(path.resolve(__dirname, '../style.css'), 'utf8');

  it('hides the native cursor', () => {
    // Critical for your custom 3D cursor to work correctly
    expect(css).toContain('cursor: none;');
  });

  it('prevents scrollbars (overflow: hidden)', () => {
    // Ensures the 3D scene doesn't bounce or scroll on mobile/desktop
    expect(css).toContain('overflow: hidden;');
  });

  it('removes body margins', () => {
    // Prevents white gaps around the canvas
    expect(css).toContain('margin: 0;');
  });

  it('sets the background to black', () => {
    // Prevents a white flash before the Three.js scene loads
    expect(css).toMatch(/background:\s*(#000|black);/);
  });

  it('ensures canvas is block-level', () => {
    // Prevents the "4px gap" at the bottom of the canvas
    expect(css).toContain('display: block;');
  });
});