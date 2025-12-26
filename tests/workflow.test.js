import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('GitHub Actions Workflow', () => {
  const workflowPath = path.resolve(__dirname, '../.github/workflows/ci.yaml');
  
  // Skip test if file doesn't exist yet (prevents CI from breaking itself)
  const workflowExists = fs.existsSync(workflowPath);

  it('exists in the correct directory', () => {
    expect(workflowExists).toBe(true);
  });

  if (workflowExists) {
    const fileContent = fs.readFileSync(workflowPath, 'utf8');
    const config = yaml.load(fileContent);

    it('triggers on the correct branches', () => {
      const pushBranches = config.on.push.branches;
      expect(pushBranches).toContain('main');
      expect(pushBranches).toContain('JCDevBranch');
    });

    it('uses the correct Node.js version', () => {
      const setupNodeStep = config.jobs.test.steps.find(step => step.uses?.includes('setup-node'));
      expect(setupNodeStep.with['node-version']).toBe('20');
    });

    it('contains the necessary canvas dependencies for Vitest/JSDOM', () => {
      const installDepsStep = config.jobs.test.steps.find(step => step.name === 'Install system dependencies');
      expect(installDepsStep.run).toContain('libcairo2-dev');
      expect(installDepsStep.run).toContain('libpango1.0-dev');
    });

    it('runs linting before running tests', () => {
      const steps = config.jobs.test.steps.map(s => s.name || s.run);
      const lintIndex = steps.findIndex(s => s?.includes('Run linter'));
      const testIndex = steps.findIndex(s => s?.includes('Run Unit Tests'));
      
      expect(lintIndex).toBeLessThan(testIndex);
    });
  }
});