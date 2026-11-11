import { PermissionFlagsBits, type Message } from "discord.js";
import {
  MAX_PER_GUILD,
  addSubscription,
  listSubscriptions,
  removeSubscription,
} from "./twitterWatcher.js";

const PREFIX = "s.";
const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/;

const USAGE = [
  "**使い方**",
  "`s.twitterset ユーザー名 #チャンネル` : 監視を追加/送信先を変更(チャンネル省略で現在のチャンネル)",
  "`s.twitterdel ユーザー名` : 監視を削除",
  "`s.twitterlist` : 設定一覧",
].join("\n");

function parseChannelId(arg: string | undefined, fallback: string): string | null {
  if (!arg) return fallback;
  const m = arg.match(/^<#(\d+)>$/) ?? arg.match(/^(\d{17,20})$/);
  return m ? m[1] : null;
}

/**
 * Twitter関連コマンドなら処理して true を返す。それ以外は false。
 * onMessageCreate の冒頭で: if (await handleTwitterCommand(message)) return;
 */
async function handleTwitterCommandInner(message: Message): Promise<boolean> {
  const content = message.content.trim();
  if (message.author.bot || !message.guild || !content.startsWith(PREFIX)) return false;

  const [cmdRaw, ...args] = content.slice(PREFIX.length).trim().split(/\s+/);
  const cmd = cmdRaw?.toLowerCase();
  if (cmd !== "twitterset" && cmd !== "twitterdel" && cmd !== "twitterlist") return false;

  const reply = (content: string) =>
    message.reply({ content, allowedMentions: { repliedUser: false } });

  // 監視はサーバー全体に影響するため、サーバー管理権限を必須にする
  if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await reply("このコマンドには「サーバー管理」権限が必要です。");
    return true;
  }

  if (cmd === "twitterlist") {
    const subs = await listSubscriptions(message.guild.id);
    await reply(
      subs.length === 0
        ? "設定はありません。\n" + USAGE
        : `**設定一覧** (${subs.length}/${MAX_PER_GUILD})\n` +
            subs.map((s) => `@${s.username} → <#${s.channelId}>`).join("\n"),
    );
    return true;
  }

  const username = args[0]?.replace(/^@/, "");
  if (!username || !USERNAME_RE.test(username)) {
    await reply("ユーザー名を正しく指定してください。\n" + USAGE);
    return true;
  }

  if (cmd === "twitterdel") {
    const removed = await removeSubscription(message.guild.id, username);
    await reply(removed ? `@${username} の監視を削除しました。` : `@${username} は設定されていません。`);
    return true;
  }

  // twitterset
  const channelId = parseChannelId(args[1], message.channelId);
  const channel = channelId ? await message.guild.channels.fetch(channelId).catch(() => null) : null;
  if (!channel || !channel.isTextBased()) {
    await reply("送信先チャンネルを正しく指定してください(例: #general)。");
    return true;
  }

  const me = message.guild.members.me;
  if (me && !channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
    await reply("Botがそのチャンネルに送信できません。権限を確認してください。");
    return true;
  }

  const result = await addSubscription({
    guildId: message.guild.id,
    username,
    channelId: channel.id,
  });

  if (!result.ok) await reply(result.reason);
  else
    await reply(
      `@${username.toLowerCase()} の新規ツイートを <#${channel.id}> に送信します。` +
        (result.updated ? "(送信先を更新しました)" : ""),
    );
  return true;
}

export async function handleTwitterCommand(message: Message): Promise<boolean> {
  try {
    return await handleTwitterCommandInner(message);
  } catch (e) {
    console.error("[twitter] コマンド処理エラー:", e);
    await message
      .reply({
        content: "エラーが発生しました。しばらくしてからもう一度お試しください。",
        allowedMentions: { repliedUser: false },
      })
      .catch(() => {});
    return true;
  }
}
