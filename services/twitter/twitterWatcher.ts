import {
  ChannelType,
  PermissionFlagsBits,
  type Client,
  type GuildBasedChannel,
  type GuildMember,
} from "discord.js";
import Parser from "rss-parser";
import { callGAS } from "../gasClient.js";

export type Subscription = {
  guildId: string;
  /** 照合・既読管理用のキー(小文字・@なし) */
  username: string;
  /** 表示用。入力された大文字小文字のまま(古いデータでは未設定) */
  displayName?: string;
  channelId: string;
};

/** 表示用のユーザー名 */
export const displayOf = (s: Subscription): string => s.displayName ?? s.username;

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
    .map((i) => ({ id: i.guid ?? i.link ?? "", link: i.link ?? "", title: i.title ?? "" }))
    .filter((i) => i.id && i.link);
}

// x.com / twitter.com 等のURLを fxtwitter.com に置換
function toFxUrl(link: string): string | null {
  const m = link.match(/^https?:\/\/[^/]+\/([^/]+\/status\/\d+)/);
  return m ? `https://fxtwitter.com/${m[1]}` : null;
}

/** フォーラム / メディアチャンネルか(これらには直接メッセージを送れず、投稿(スレッド)を作成する) */
export function isForumLike(channel: { type: ChannelType }): boolean {
  return channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia;
}

/** 送信先として使えるか確認する。問題があればエラーメッセージ、なければ null */
export function checkTargetChannel(
  channel: GuildBasedChannel | null,
  me: GuildMember | null,
): string | null {
  if (!channel || !(channel.isTextBased() || isForumLike(channel))) {
    return "送信先チャンネルを正しく指定してください(テキスト、アナウンス、フォーラムが指定できます)。";
  }
  if (!me) return null;

  // フォーラムの投稿作成は「メッセージを送信」、既存スレッドへの送信は「スレッドでメッセージを送信」が必要
  const needed = channel.isThread()
    ? [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessagesInThreads]
    : [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages];
  if (!channel.permissionsFor(me)?.has(needed)) {
    return "Botがそのチャンネルに送信できません。権限を確認してください。";
  }
  // ロックされた投稿には「スレッドの管理」権限がないと送信できない
  if (channel.isThread() && channel.locked && !channel.permissionsFor(me)?.has(PermissionFlagsBits.ManageThreads)) {
    return "その投稿はロックされているため、Botが送信できません。";
  }
  return null;
}

/** フォーラム投稿のタイトル(100文字以内)。ツイート本文からURLと改行を除いて作る */
function threadTitle(username: string, text: string): string {
  const clean = text.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  const title = clean ? `@${username} ${clean}` : `@${username} のツイート`;
  return title.slice(0, 100);
}

async function sendTo(client: Client, channelId: string, content: string, title: string) {
  try {
    const ch = await client.channels.fetch(channelId);
    if (!ch) return;
    if (ch.type === ChannelType.GuildForum || ch.type === ChannelType.GuildMedia) {
      // フォーラム: ツイートごとに新しい投稿を作成
      await ch.threads.create({ name: title, message: { content } });
    } else if (ch.isTextBased() && "send" in ch) {
      // フォーラム投稿などのスレッドは、一定期間で自動アーカイブされるため、送信前に解除する
      if (ch.isThread() && ch.archived) await ch.setArchived(false).catch(() => {});
      await ch.send(content);
    }
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

  const prev = existing ? { channelId: existing.channelId, displayName: existing.displayName } : null;
  if (existing) {
    existing.channelId = sub.channelId;
    existing.displayName = sub.username;
  } else {
    store.subs.push({ guildId: sub.guildId, username, displayName: sub.username, channelId: sub.channelId });
  }

  try {
    if (needsSeen) await saveSeen(username);
    await saveSubs();
  } catch (e) {
    // 保存できなかった場合は元に戻す(再起動で消える設定を「成功」と答えない)
    console.error("[twitter] 保存失敗:", e);
    if (existing && prev) {
      existing.channelId = prev.channelId;
      existing.displayName = prev.displayName;
    } else store.subs = store.subs.filter((s) => !(s.guildId === sub.guildId && s.username === username));
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
        await sendTo(client, t.channelId, url, threadTitle(displayOf(t), item.title));
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
