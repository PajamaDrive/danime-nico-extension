import { extractVideoId } from './core';

document.getElementById('load-btn')?.addEventListener('click', () => {
  const input = (document.getElementById('nico-url') as HTMLInputElement).value.trim();
  const status = document.getElementById('status') as HTMLParagraphElement;
  const loadBtn = document.getElementById('load-btn') as HTMLButtonElement;

  const videoId = extractVideoId(input);
  if (!videoId) {
    status.textContent = '無効なURLまたはIDです (例: sm1234567)。';
    status.style.color = 'red';
    return;
  }
  status.textContent = 'コメント取得中...';
  status.style.color = 'black';
  loadBtn.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0 || !tabs[0].url?.includes('animestore.docomo.ne.jp')) {
      status.textContent = 'エラー: dアニメストアの再生ページで実行してください。';
      status.style.color = 'red';
      loadBtn.disabled = false;
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'FETCH_AND_SEND',
        videoId: videoId,
        tabId: tabs[0].id,
      },
      (response) => {
        loadBtn.disabled = false;
        if (response && response.success) {
          status.textContent = 'コメントを反映しました！右上の × で閉じて再生してください。';
          status.style.color = 'green';
        } else {
          status.textContent = 'エラー: ' + (response ? response.error : '不明なエラー');
          status.style.color = 'red';
        }
      },
    );
  });
});
