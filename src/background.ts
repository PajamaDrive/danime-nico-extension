import { NicoComment, NicoSession, NicoThreadKey, parseCommand } from './core';

// dアニメストアのニコ実況コメントフェッチ
async function fetchNicoComments(videoId: string, timestamp: number): Promise<NicoComment[]> {
  // 1. スレッドキーの取得
  const threadKey = await getThreadKey(videoId);
  
  // 2. コメントリクエストの送信
  const comments = await getComments(threadKey, timestamp);
  
  return comments;
}

async function getThreadKey(videoId: string): Promise<NicoThreadKey> {
  // ニコニコ実況のAPIを叩いてスレッドキーを取得するシミュレーション
  return {
    threadId: "jk" + videoId,
    key: "dummy_key",
    service: "jk1"
  };
}

async function getComments(threadKey: NicoThreadKey, timestamp: number): Promise<NicoComment[]> {
  // 本来はWebSocketやHTTPリクエストでコメントを取得
  console.log(`Fetching comments for ${threadKey.threadId} at ${timestamp}`);
  return [
    {
      id: "1",
      text: "テストコメント1",
      vpos: timestamp + 1000,
      userId: "u1",
      command: parseCommand("white normal")
    },
    {
      id: "2",
      text: "わこつ",
      vpos: timestamp + 2500,
      userId: "u2",
      command: parseCommand("red big")
    }
  ];
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_COMMENTS") {
    fetchNicoComments(message.videoId, message.timestamp)
      .then(comments => sendResponse({ comments }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // async response
  }
});
