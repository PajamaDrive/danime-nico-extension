import { expect, test, describe } from 'vitest';
import { extractThreadKey, extractThreadTargets, parseCommentCommands } from '../src/core';

describe('Niconico Core Logic', () => {
    test('extractThreadKey should extract the JWT token', () => {
        const encodedHtml = `&quot;threadKey&quot;:&quot;eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.bW9ja190b2tlbl9wYXlsb2Fk.c2lnbmF0dXJl&quot;`;
        const key = extractThreadKey(encodedHtml);
        expect(key).toBe('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.bW9ja190b2tlbl9wYXlsb2Fk.c2lnbmF0dXJl');
    });

    test('extractThreadKey should throw if missing', () => {
        expect(() => extractThreadKey('<html>no key here</html>')).toThrow(/threadKey が見つかりません/);
    });

    test('extractThreadTargets should extract owner and main forks', () => {
        const html = `&quot;id&quot;:&quot;12345&quot;,&quot;fork&quot;:&quot;owner&quot;, some junk &quot;id&quot;:&quot;67890&quot;,&quot;fork&quot;:&quot;main&quot;`;
        const targets = extractThreadTargets(html);
        expect(targets).toHaveLength(2);
        expect(targets[0]).toEqual({ id: '12345', fork: 'owner' });
        expect(targets[1]).toEqual({ id: '67890', fork: 'main' });
    });

    test('parseCommentCommands should parse colors correctly', () => {
        const style = parseCommentCommands(['red', 'big', 'shita']);
        expect(style.color).toBe('#FF0000');
        expect(style.size).toBe('64px');
        expect(style.position).toBe('fixed-bottom');
        expect(style.textShadow).toBeNull(); // Red doesn't get shadow by default
    });

    test('parseCommentCommands should add textShadow for black text', () => {
        const style1 = parseCommentCommands(['black']);
        expect(style1.color).toBe('#000000');
        expect(style1.textShadow).not.toBeNull();
        expect(style1.textShadow).toContain('#fff');

        const style2 = parseCommentCommands(['#000000']);
        expect(style2.textShadow).not.toBeNull();
    });

    test('parseCommentCommands default values', () => {
        const style = parseCommentCommands([]);
        expect(style.color).toBe('#ffffff');
        expect(style.size).toBe('44px');
        expect(style.position).toBe('scroll');
    });
});
