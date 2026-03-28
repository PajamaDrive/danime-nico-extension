import { expect, it, describe } from 'vitest';
import {
  extractThreadKey,
  extractThreadTargets,
  parseCommentCommands,
  extractVideoId,
  parseNicoCommentResponse,
} from '../src/core';

describe('core', () => {
  describe('extractThreadKey', () => {
    it('JWTトークンを正しく抽出できること', () => {
      const encodedHtml = `&quot;threadKey&quot;:&quot;eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.bW9ja190b2tlbl9wYXlsb2Fk.c2lnbmF0dXJl&quot;`;
      const key = extractThreadKey(encodedHtml);
      expect(key).toBe(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.bW9ja190b2tlbl9wYXlsb2Fk.c2lnbmF0dXJl',
      );
    });

    it('見つからない場合はエラーを発生させること', () => {
      expect(() => extractThreadKey('<html>no key here</html>')).toThrow(
        /threadKey が見つかりません/,
      );
    });
  });

  describe('extractThreadTargets', () => {
    it('ownerとmainのフォークを正しく抽出できること', () => {
      const html = `&quot;id&quot;:&quot;12345&quot;,&quot;fork&quot;:&quot;owner&quot;, some junk &quot;id&quot;:&quot;67890&quot;,&quot;fork&quot;:&quot;main&quot;`;
      const targets = extractThreadTargets(html);
      expect(targets).toHaveLength(2);
      expect(targets[0]).toEqual({ id: '12345', fork: 'owner' });
      expect(targets[1]).toEqual({ id: '67890', fork: 'main' });
    });

    it('フォーク指定がない場合のフォールバック（threadIds）', () => {
      const html = `&quot;threadIds&quot;:[&quot;{&quot;id&quot;:98765`;
      const targets = extractThreadTargets(html);
      expect(targets).toHaveLength(3); // owner, main, easy
      expect(targets.map((t) => t.id)).toEqual(['98765', '98765', '98765']);
    });
  });

  describe('extractVideoId', () => {
    it('URLから動画IDを抽出できること', () => {
      expect(extractVideoId('https://www.nicovideo.jp/watch/sm12345')).toBe('sm12345');
      expect(extractVideoId('sm12345')).toBe('sm12345');
      expect(extractVideoId('so67890')).toBe('so67890');
    });

    it('無効な入力に対して null を返すこと', () => {
      expect(extractVideoId('https://google.com')).toBeNull();
      expect(extractVideoId('12345')).toBeNull();
    });
  });

  describe('parseNicoCommentResponse', () => {
    it('コメントサーバーのレスポンスを正しくパースしてソートすること', () => {
      const mockData = {
        data: {
          threads: [
            {
              comments: [
                { vposMs: 2000, body: 'later comment' },
                { vposMs: 1000, body: 'early comment', commands: ['red'] },
              ],
            },
          ],
        },
      };
      const comments = parseNicoCommentResponse(mockData);
      expect(comments).toHaveLength(2);
      expect(comments[0].body).toBe('early comment');
      expect(comments[0].commands).toEqual(['red']);
      expect(comments[1].body).toBe('later comment');
    });

    it('vposMs がない場合は vpos から変換すること', () => {
      const mockData = {
        data: {
          threads: [{ comments: [{ vpos: 100, body: 'old style' }] }],
        },
      };
      const comments = parseNicoCommentResponse(mockData);
      expect(comments[0].vposMs).toBe(1000);
    });
  });

  describe('parseCommentCommands', () => {
    it('コメントのスタイル（色、サイズ、位置）を正しく解析できること', () => {
      const style = parseCommentCommands(['red', 'big', 'shita']);
      expect(style.color).toBe('#FF0000');
      expect(style.size).toBe('64px');
      expect(style.position).toBe('fixed-bottom');
      expect(style.textShadow).toBeNull();
    });

    it('黒文字の場合は白のテキストシャドウを追加すること', () => {
      const style1 = parseCommentCommands(['black']);
      expect(style1.color).toBe('#000000');
      expect(style1.textShadow).not.toBeNull();
      expect(style1.textShadow).toContain('#fff');

      const style2 = parseCommentCommands(['#000000']);
      expect(style2.textShadow).not.toBeNull();
    });

    it('追加のコマンド（small, ue, 特殊色, カスタム色）', () => {
      const style1 = parseCommentCommands(['small', 'ue', 'miku']);
      expect(style1.size).toBe('28px');
      expect(style1.position).toBe('fixed-top');
      expect(style1.color).toBe('#00ccff');

      const style2 = parseCommentCommands(['#123456']);
      expect(style2.color).toBe('#123456');

      const style3 = parseCommentCommands(['niconicou']);
      expect(style3.color).toBe('#cc0033');
    });

    it('デフォルト値が正しく設定されること', () => {
      const style = parseCommentCommands([]);
      expect(style.color).toBe('#ffffff');
      expect(style.size).toBe('44px');
      expect(style.position).toBe('scroll');
    });
  });
});
