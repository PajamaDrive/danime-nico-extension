export interface ThreadTarget {
  id: string;
  fork: 'owner' | 'main' | 'easy' | string;
}

export interface NicoComment {
  body: string;
  vposMs: number;
  commands: string[];
  shown?: boolean;
}

export function extractThreadKey(html: string): string {
  const threadKeyRegex =
    /&quot;threadKey&quot;:&quot;(eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)&quot;/;
  const match = html.match(threadKeyRegex);
  if (!match) {
    throw new Error(
      'threadKey が見つかりません。ログインが必要な動画か、ページ構造が変わった可能性があります。',
    );
  }
  return match[1];
}

export function extractThreadTargets(html: string): ThreadTarget[] {
  const targets: ThreadTarget[] = [];
  const forkRegex =
    /&quot;id&quot;:&quot;?(\d+)&quot;?,&quot;fork&quot;:&quot;(owner|main|easy)&quot;/g;
  let m;
  while ((m = forkRegex.exec(html)) !== null) {
    targets.push({ id: m[1], fork: m[2] });
  }

  if (targets.length === 0) {
    const singleIdRegex = /&quot;threadIds&quot;:\[&quot;\{&quot;id&quot;:(\d+)/;
    const singleMatch = html.match(singleIdRegex);
    if (singleMatch) {
      const tid = singleMatch[1];
      targets.push({ id: tid, fork: 'owner' });
      targets.push({ id: tid, fork: 'main' });
      targets.push({ id: tid, fork: 'easy' });
    }
  }
  return targets;
}

export function extractVideoId(input: string): string | null {
  const match = input.match(/(?:sm|so|nm)\d+/);
  return match ? match[0] : null;
}

export function parseNicoCommentResponse(commentData: {
  data?: {
    threads?: {
      comments?: { vposMs?: number; vpos?: number; body: string; commands?: string[] }[];
    }[];
  };
}): NicoComment[] {
  const comments: NicoComment[] = [];

  (commentData?.data?.threads || []).forEach(
    (thread: {
      comments?: { vposMs?: number; vpos?: number; body: string; commands?: string[] }[];
    }) => {
      (thread.comments || []).forEach(
        (c: { vposMs?: number; vpos?: number; body: string; commands?: string[] }) => {
          comments.push({
            vposMs: c.vposMs != null ? c.vposMs : c.vpos != null ? c.vpos * 10 : 0,
            body: c.body,
            commands: c.commands || [],
          });
        },
      );
    },
  );

  return comments.sort((a, b) => a.vposMs - b.vposMs);
}

export interface CommentStyle {
  color: string;
  size: string;
  textShadow: string | null;
  position: 'fixed-top' | 'fixed-bottom' | 'scroll';
}

export function parseCommentCommands(commands: string[]): CommentStyle {
  let color = '#ffffff';
  let size = '44px';
  let position: 'fixed-top' | 'fixed-bottom' | 'scroll' = 'scroll';

  const colorsMap: Record<string, string> = {
    red: '#FF0000',
    pink: '#FF8080',
    orange: '#FFC000',
    yellow: '#FFFF00',
    green: '#00FF00',
    cyan: '#00FFFF',
    blue: '#0000FF',
    purple: '#C000FF',
    black: '#000000',
    white: '#FFFFFF',
    white2: '#CCCC99',
    niconicou: '#cc0033',
    miku: '#00ccff',
  };

  commands.forEach((cmd) => {
    if (colorsMap[cmd]) color = colorsMap[cmd];
    else if (cmd.startsWith('#')) color = cmd;

    if (cmd === 'big') size = '64px';
    if (cmd === 'small') size = '28px';

    if (cmd === 'ue') position = 'fixed-top';
    if (cmd === 'shita') position = 'fixed-bottom';
  });

  let textShadow = null;
  if (color.toLowerCase() === '#000000' || color === 'black') {
    textShadow =
      '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 0px 1px 0 #fff, 0px -1px 0 #fff, 1px 0px 0 #fff, -1px 0px 0 #fff';
  }

  return { color, size, textShadow, position };
}
