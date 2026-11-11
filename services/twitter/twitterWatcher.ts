import type { Client } from "discord.js";
import Parser from "rss-parser";
import { callGAS } from "../gasClient.js";

export type Subscription = {
  guildId: string;
  /** 小文字・@なしで保存 */
  username: string;
  channelId: string;
};

type Store = {
  subs: Subscription[];
  /** username -> 既読ツイートID */
  seen: Record<string, string[]>;
};

// ===== 設定(環境変数) =====
const RSSHUB_URL = (process.env.RSSHUB_URL ?? "http://rsshub:1200").replace(/\/$/, "");
const INTERVAL_SEC = Number(process.env.TWEET_INTERVAL_SEC ?? 300);

export const MAX_PER_GUILD = 10; // 1サーバーあたりの監視上限
const MAX_SEEN = 100;

// ===== GAS(メモ機能の保存領域)を保存先として使う =====
// 既存の memoDB_discord シートに、次のキーで保存する(GAS側の変更は不要)
//   userId "__twitter__" / key "subs"          -> 監視設定の配列(JSON)
//   userId "__twitter__" / key "seen:<user>"   -> そのアカウントの既読ID配列(JSON)
const GAS_OWNER = "__twitter__";
const GAS_NOT_FOUND = "メモがありません";

const parser = new Parser();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function gas(action: "save" | "get" | "delete", key: string, content = ""): Promise<string> {
  const res = await callGAS(action, GAS_OWNER, key, content);
  if (res.startsWith("Error")) throw new Error(`GAS ${action} "${key}" 失敗: ${res}`);
  return res;
}

let store: Store = { subs: [], seen: {} };

// ===== 読み込み(失敗したまま空の状態で上書き保存しないよう、成功するまで「未読込」扱い) =====
let loadPromise: Promise<void> | null = null;

async function doLoad() {
  const raw = await gas("get", "subs");
  const subs: Subscription[] = raw === GAS_NOT_FOUND ? [] : JSON.parse(raw);

  const seen: Record<string, string[]> = {};
  for (const username of new Set(subs.map((s) => s.username))) {
    const r = await gas("get", `seen:${username}`);
    if (r !== GAS_NOT_FOUND) seen[username] = JSON.parse(r);
  }
  store = { subs, seen };
  console.log(`[twitter] GASから読み込み: ${subs.length}件`);
}

function ensureLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = doLoad().catch((e) => {
      loadPromise = null; // 次回また読み込みを試す
      throw e;
    });
  }
  return loadPromise;
}

// ===== 保存(順番どおりに1つずつ実行) =====
let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.catch(() => {}).then(fn);
  queue = run;
  return run;
}

const saveSubs = () => enqueue(() => gas("save", "subs", JSON.stringify(store.subs)));
const saveSeen = (username: string) =>
  enqueue(() => gas("save", `seen:${username}`, JSON.stringify(store.seen[username] ?? [])));
const deleteSeen = (username: string) => enqueue(() => gas("delete", `seen:${username}`));

// ===== フィード取得 =====
async function fetchItems(username: string) {
  const feed = await parser.parseURL(`${RSSHUB_URL}/twitter/user/${username}`);
  return feed.items
    .map((i) => ({ id: i.guid ?? i.link ?? "", link: i.link ?? "" }))
    .filter((i) => i.id && i.link);
}

// x.com / twitter.com 等のURLを fxtwitter.com に置換
function toFxUrl(link: string): string | null {
  const m = link.match(/^https?:\/\/[^/]+\/([^/]+\/status\/\d+)/);
  return m ? `https://fxtwitter.com/${m[1]}` : null;
}

async function sendTo(client: Client, channelId: string, content: string) {
  try {
    const ch = await client.channels.fetch(channelId);
    if (ch && ch.isTextBased() && "send" in ch) await ch.send(content);
  } catch (e) {
    console.error(`[twitter] 送信失敗 (channel ${channelId}):`, e);
  }
}

// ===== コマンドから使う操作 =====

export async function addSubscription(
  sub: Subscription,
): Promise<{ ok: true; updated: boolean } | { ok: false; reason: string }> {
  try {
    await ensureLoaded();
  } catch (e) {
    console.error("[twitter] 読み込み失敗:", e);
    return { ok: false, reason: "保存データを読み込めませんでした。しばらくしてからお試しください。" };
  }

  const username = sub.username.toLowerCase();
  const mine = store.subs.filter((s) => s.guildId === sub.guildId);
  const existing = mine.find((s) => s.username === username);
  if (!existing && mine.length >= MAX_PER_GUILD) {
    return { ok: false, reason: `このサーバーでは最大${MAX_PER_GUILD}アカウントまで設定できます。` };
  }

  // 初回登録時にフィードを取得し、既存ツイートを既読化(大量投稿の防止 + ユーザー名の検証)
  const needsSeen = !store.seen[username];
  if (needsSeen) {
    try {
      const items = await fetchItems(username);
      store.seen[username] = items.map((i) => i.id).slice(0, MAX_SEEN);
    } catch (e) {
      console.error("[twitter] フィード取得失敗:", e);
      return {
        ok: false,
        reason: "RSSを取得できませんでした。ユーザー名、またはRSSHubの設定を確認してください。",
      };
    }
  }

  const prevChannelId = existing?.channelId;
  if (existing) existing.channelId = sub.channelId;
  else store.subs.push({ guildId: sub.guildId, username, channelId: sub.channelId });

  try {
    if (needsSeen) await saveSeen(username);
    await saveSubs();
  } catch (e) {
    // 保存できなかった場合は元に戻す(再起動で消える設定を「成功」と答えない)
    console.error("[twitter] 保存失敗:", e);
    if (existing && prevChannelId) existing.channelId = prevChannelId;
    else store.subs = store.subs.filter((s) => !(s.guildId === sub.guildId && s.username === username));
    if (!store.subs.some((s) => s.username === username)) delete store.seen[username];
    return { ok: false, reason: "設定の保存に失敗しました。しばらくしてからお試しください。" };
  }
  return { ok: true, updated: !!existing };
}

export async function removeSubscription(guildId: string, username: string): Promise<boolean> {
  await ensureLoaded();
  const key = username.toLowerCase();
  const before = store.subs;
  store.subs = store.subs.filter((s) => !(s.guildId === guildId && s.username === key));
  if (store.subs.length === before.length) return false;

  try {
    await saveSubs();
  } catch (e) {
    store.subs = before; // 保存失敗時は元に戻す
    throw e;
  }

  // 誰も監視していなければ既読も破棄(再登録時の過去ツイート大量送信を防ぐ)
  if (!store.subs.some((s) => s.username === key)) {
    delete store.seen[key];
    await deleteSeen(key).catch((e) => console.error("[twitter] 既読の削除失敗:", e));
  }
  return true;
}

export async function listSubscriptions(guildId: string): Promise<Subscription[]> {
  await ensureLoaded();
  return store.subs.filter((s) => s.guildId === guildId);
}

// ===== 定期チェック =====

async function checkUser(client: Client, username: string) {
  const items = await fetchItems(username);

  if (!store.seen[username]) {
    store.seen[username] = items.map((i) => i.id).slice(0, MAX_SEEN);
    await saveSeen(username);
    return;
  }

  const seen = new Set(store.seen[username]);
  const fresh = items.filter((i) => !seen.has(i.id)).reverse(); // 古い順
  if (fresh.length === 0) return;

  const targets = store.subs.filter((s) => s.username === username);
  for (const item of fresh) {
    const url = toFxUrl(item.link);
    if (url) {
      for (const t of targets) {
        await sendTo(client, t.channelId, url);
        await sleep(500);
      }
      console.log("[twitter] 送信:", url);
    }
    seen.add(item.id);
  }
  store.seen[username] = [...seen].slice(-MAX_SEEN);
  await saveSeen(username).catch((e) => console.error("[twitter] 既読の保存失敗:", e));
}

let running = false;

async function tick(client: Client) {
  if (running) return; // 前回が終わっていなければスキップ
  running = true;
  try {
    try {
      await ensureLoaded();
    } catch (e) {
      console.error("[twitter] 読み込み失敗(次回再試行):", e);
      return;
    }
    const users = [...new Set(store.subs.map((s) => s.username))];
    for (const user of users) {
      try {
        await checkUser(client, user);
      } catch (e) {
        console.error(`[twitter] @${user} のチェックでエラー(次回再試行):`, e);
      }
    }
  } finally {
    running = false;
  }
}

/** bot.ts の clientReady 内で1回だけ呼ぶ */
export function startTweetWatcher(client: Client) {
  console.log(`[twitter] 監視開始: ${INTERVAL_SEC}秒ごと`);
  void tick(client);
  setInterval(() => void tick(client), INTERVAL_SEC * 1000);
}
