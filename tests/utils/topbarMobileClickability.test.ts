import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TopBar Mobile Clickability & Touch Ergonomics', () => {
  const rootDir = process.cwd();
  const indexCssPath = path.join(rootDir, 'index.css');
  const userMenuPath = path.join(rootDir, 'components', 'topbar', 'UserMenu.tsx');
  const activityCenterPath = path.join(rootDir, 'components', 'topbar', 'ActivityCenter.tsx');
  const topbarPath = path.join(rootDir, 'components', 'TopBar.tsx');

  it('guarantees index.css never suppresses backdrop-blur elements with substring blur- display:none', () => {
    const css = fs.readFileSync(indexCssPath, 'utf8');
    // Ensure the bug that hid all backdrop-blur dropdowns on mobile is eliminated
    expect(css).not.toContain('[class*="blur-"]');
    expect(css).not.toMatch(/\[class\*=["']blur-["']\]\s*\{\s*display:\s*none/);
  });

  it('guarantees UserMenu trigger is an accessible button with min-h-[44px] and touch-manipulation', () => {
    const content = fs.readFileSync(userMenuPath, 'utf8');
    expect(content).toContain('<button');
    expect(content).toContain('type="button"');
    expect(content).toContain('min-h-[44px]');
    expect(content).toContain('touch-manipulation');
    expect(content).toContain('aria-label="User Profile and Menu"');
  });

  it('guarantees UserMenu dropdown has mobile scrollability and viewport containment', () => {
    const content = fs.readFileSync(userMenuPath, 'utf8');
    expect(content).toContain('max-h-[calc(100vh-4.5rem)]');
    expect(content).toContain('overflow-y-auto');
    expect(content).toContain('fixed sm:absolute');
  });

  it('guarantees zero raw unicode emojis exist in UserMenu', () => {
    const content = fs.readFileSync(userMenuPath, 'utf8');
    expect(content).not.toContain('⚠️');
    expect(content).not.toContain('🔒');
    expect(content).not.toContain('✅');
    expect(content).not.toContain('❌');
  });

  it('guarantees ActivityCenter notification trigger enforces min 44px tap target and touch-manipulation', () => {
    const content = fs.readFileSync(activityCenterPath, 'utf8');
    expect(content).toContain('min-w-[44px]');
    expect(content).toContain('min-h-[44px]');
    expect(content).toContain('touch-manipulation');
  });

  it('guarantees TopBar supports touchstart in click-outside handling for mobile devices', () => {
    const content = fs.readFileSync(topbarPath, 'utf8');
    expect(content).toContain("document.addEventListener('touchstart', handleClickOutside");
    expect(content).toContain("document.removeEventListener('touchstart', handleClickOutside");
  });

  it('enforces Rule 2 (all modified files strictly under 500 lines)', () => {
    const files = [indexCssPath, userMenuPath, activityCenterPath, topbarPath];
    for (const f of files) {
      const lines = fs.readFileSync(f, 'utf8').split('\n').length;
      expect(lines).toBeLessThanOrEqual(500);
    }
  });
});
