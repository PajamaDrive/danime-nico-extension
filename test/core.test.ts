import { describe, it, expect } from 'vitest';
import { parseCommand, formatVposToTime } from '../src/core';

describe('core logic tests', () => {
  it('should parse simple colors', () => {
    expect(parseCommand('red').color).toBe('#ff0000');
    expect(parseCommand('white').color).toBe('#ffffff');
  });

  it('should parse sizes and positions', () => {
    const cmd = parseCommand('big ue green');
    expect(cmd.size).toBe('big');
    expect(cmd.position).toBe('top');
    expect(cmd.color).toBe('#00ff00');
  });

  it('should format vpos to time string', () => {
    expect(formatVposToTime(6000)).toBe('01:00');
    expect(formatVposToTime(12500)).toBe('02:05');
  });
});
