import {
  extractThreadKey,
  extractThreadTargets,
  ThreadTarget,
  parseNicoCommentResponse,
} from './core';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'FETCH_AND_SEND') {
    fetchNicoComments(request.videoId)
      .then((comments) => {
        if (!comments || comments.length === 0) {
          sendResponse({ success: false, error: 'コメントが0件、または取得に失敗しました。' });
          return;
        }

        const tabId = request.tabId || (sender.tab ? sender.tab.id : undefined);
        if (tabId) {
          chrome.tabs.sendMessage(
            tabId,
            {
              type: 'START_COMMENTS',
              comments: comments,
            },
            (_res) => {
              if (chrome.runtime.lastError) {
                sendResponse({
                  success: false,
                  error:
                    'dアニメストアのページで拡張機能がロードされていません。タブをリロードして再試行してください。',
                });
              } else {
                sendResponse({ success: true });
              }
            },
          );
        } else {
          sendResponse({ success: false, error: 'Tab ID undefined' });
        }
      })
      .catch((err) => {
        console.error('[NicoExt] fetchNicoComments error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

async function fetchNicoComments(videoId: string) {
  const watchUrl = `https://www.nicovideo.jp/watch/${videoId}`;
  const pageRes = await fetch(watchUrl, {
    headers: { Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'ja,en;q=0.9' },
    credentials: 'include',
  });

  if (!pageRes.ok) throw new Error(`動画ページの取得に失敗しました: HTTP ${pageRes.status}`);

  const html = await pageRes.text();
  let threadKey: string;
  let targets: ThreadTarget[];

  try {
    threadKey = extractThreadKey(html);
    targets = extractThreadTargets(html);
  } catch (_e) {
    return await fetchViaGuestApi(videoId, '');
  }

  if (targets.length === 0) {
    return await fetchViaGuestApi(videoId, threadKey);
  }

  return await fetchComments(threadKey, targets);
}

async function fetchViaGuestApi(videoId: string, fallbackKey: string) {
  const res = await fetch(
    `https://www.nicovideo.jp/api/watch/v3_guest/${videoId}?_frontendId=6&_frontendVersion=0`,
    { headers: { 'X-Frontend-Id': '6', 'X-Frontend-Version': '0' }, credentials: 'include' },
  );
  if (!res.ok) throw new Error(`ゲストAPIも失敗しました: HTTP ${res.status}`);
  const data = await res.json();
  const nvComment = data?.data?.comment?.nvComment;
  if (!nvComment) throw new Error('ゲストAPIからもコメント情報を取得できませんでした。');
  const key = nvComment.threadKey || fallbackKey;
  const tgts: ThreadTarget[] = (nvComment.threads || []).map(
    (t: { id: string | number; fork: string }) => ({
      id: String(t.id),
      fork: t.fork,
    }),
  );
  return await fetchComments(key, tgts);
}

async function fetchComments(threadKey: string, targets: ThreadTarget[]) {
  const commentRes = await fetch('https://public.nvcomment.nicovideo.jp/v1/threads?pc=1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Frontend-Id': '6',
      'X-Frontend-Version': '0',
    },
    body: JSON.stringify({ params: { targets, language: 'ja-jp' }, threadKey, additionals: {} }),
  });

  if (!commentRes.ok)
    throw new Error(`コメントサーバーからの取得に失敗: HTTP ${commentRes.status}`);
  const commentData = await commentRes.json();
  return parseNicoCommentResponse(commentData);
}
