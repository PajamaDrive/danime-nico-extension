import { parseCommentCommands, CommentStyle, NicoComment } from './core';

let comments: NicoComment[] = [];
let overlay: HTMLElement | null = null;
let videoElement: HTMLVideoElement | null = null;
let lastTimeUpdate = 0;
let commentsIndex = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_COMMENTS') {
    comments = request.comments.sort((a: NicoComment, b: NicoComment) => a.vposMs - b.vposMs);
    comments.forEach((c) => (c.shown = false));
    commentsIndex = 0;
    lastTimeUpdate = 0;
    setupOverlay();
    sendResponse({ status: 'ok' });
  }
});

function setupOverlay() {
  videoElement = document.querySelector('video');
  if (!videoElement) return;

  if (!overlay) {
    const container = videoElement.parentElement;
    if (!container) return;

    overlay = document.createElement('div');
    overlay.id = 'nico-comment-overlay';
    container.appendChild(overlay);
    container.style.position = container.style.position || 'relative';

    videoElement.addEventListener('timeupdate', onTimeUpdate);
    videoElement.addEventListener('seeked', onSeeked);
    videoElement.addEventListener('play', () => {
      overlay?.classList.remove('nico-overlay-paused');
    });
    videoElement.addEventListener('pause', () => {
      overlay?.classList.add('nico-overlay-paused');
    });

    const resizeObserver = new ResizeObserver(() => {
      if (overlay && videoElement) {
        overlay.style.width = videoElement.offsetWidth + 'px';
        overlay.style.height = videoElement.offsetHeight + 'px';
        overlay.style.left = videoElement.offsetLeft + 'px';
        overlay.style.top = videoElement.offsetTop + 'px';
      }
    });
    resizeObserver.observe(videoElement);
    resizeObserver.observe(container);
  }
}

function onSeeked() {
  if (!videoElement) return;
  const currentTime = videoElement.currentTime;
  const currentVposMs = Math.floor(currentTime * 1000);

  if (overlay) overlay.innerHTML = '';

  comments.forEach((c) => (c.shown = false));
  commentsIndex = comments.findIndex((c) => c.vposMs >= currentVposMs);
  if (commentsIndex === -1) commentsIndex = comments.length;
  lastTimeUpdate = currentTime;
}

function onTimeUpdate() {
  if (!videoElement || comments.length === 0) return;

  const currentTime = videoElement.currentTime;
  const currentVposMs = Math.floor(currentTime * 1000);

  if (Math.abs(currentTime - lastTimeUpdate) > 1.0) {
    onSeeked();
    return;
  }
  lastTimeUpdate = currentTime;

  while (commentsIndex < comments.length && comments[commentsIndex].vposMs <= currentVposMs) {
    const c = comments[commentsIndex];
    if (!c.shown) {
      c.shown = true;
      spawnComment(c);
    }
    commentsIndex++;
  }
}

function spawnComment(comment: NicoComment) {
  if (!overlay) return;

  const el = document.createElement('div');
  el.className = 'nico-comment';
  el.textContent = comment.body;

  const style: CommentStyle = parseCommentCommands(comment.commands);

  el.style.color = style.color;
  el.style.fontSize = style.size;
  if (style.textShadow) {
    el.style.textShadow = style.textShadow;
  }

  if (style.position === 'fixed-top') {
    el.style.top = Math.random() * 20 + '%';
    el.classList.add('nico-fixed');
  } else if (style.position === 'fixed-bottom') {
    el.style.bottom = Math.random() * 20 + '%';
    el.classList.add('nico-fixed');
  } else {
    el.style.top = Math.random() * 85 + '%';
    el.classList.add('nico-scroll');
  }

  overlay.appendChild(el);

  if (videoElement && videoElement.paused) {
    overlay.classList.add('nico-overlay-paused');
  }

  el.addEventListener('animationend', () => {
    el.remove();
  });
}

function createControlPanel() {
  if (document.getElementById('nico-ext-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'nico-ext-panel';
  panel.style.opacity = '0.3';
  panel.innerHTML = `
        <div style="font-size: 13px; margin-bottom: 8px; font-weight: bold;">ニコ動コメント読込</div>
        <input type="text" id="nico-ext-input" placeholder="URL または sm..." style="width: 140px; padding: 4px; font-size: 12px;">
        <button id="nico-ext-btn" style="padding: 4px 8px; font-size: 12px; cursor: pointer;">読込</button>
        <div id="nico-ext-msg" style="font-size: 11px; margin-top: 5px; color: #ffeb3b; word-break: break-all;"></div>
    `;

  document.body.appendChild(panel);

  const btn = document.getElementById('nico-ext-btn') as HTMLButtonElement;
  const input = document.getElementById('nico-ext-input') as HTMLInputElement;
  const msg = document.getElementById('nico-ext-msg') as HTMLDivElement;

  btn.addEventListener('click', () => {
    const val = input.value.trim();
    const match = val.match(/(?:sm|so|nm)\d+/);
    if (!match) {
      msg.textContent = '無効なURL/ID';
      return;
    }
    msg.textContent = '取得中...';
    chrome.runtime.sendMessage(
      {
        type: 'FETCH_AND_SEND',
        videoId: match[0],
      },
      (res) => {
        if (res && res.success) {
          msg.textContent = '完了！右上のパネルから設定可能です。';
          setTimeout(() => {
            panel.style.opacity = '0.3';
          }, 3000);
        } else {
          msg.textContent = res ? res.error : '不明なエラー';
          panel.style.opacity = '1';
        }
      },
    );
  });

  panel.addEventListener('mouseenter', () => {
    panel.style.opacity = '1';
  });
  panel.addEventListener('mouseleave', () => {
    panel.style.opacity = '0.3';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createControlPanel);
} else {
  createControlPanel();
}
