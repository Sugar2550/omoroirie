import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo.js";
import { handleIconPrefix } from "../commands/icon.js";
import { callGAS } from "../services/gasClient.js";
import { searchCharacter } from "../services/characterSearch.js";
import {
  formatSingle,
  formatMultiple,
  formatWithLimit
} from "../services/characterFormat.js";
import commandsJson from "../commands/commands.json" with { type: "json" };

const commands = commandsJson as Record<string, string>;

const NUMBER_EMOJIS = ["0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣"];

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;
  if (!message.content) return;

  const text = message.content;

  // =================================================
  // s.roll
  // =================================================
  if (text === "s.roll") {
    const seed = await callGAS("get", message.author.id, "rseed");

    if (!message.channel?.isTextBased()) return;
    const channel = message.channel;

    if (!seed || seed === "NOT_FOUND") {
      return channel.send({
        content: "rseed が設定されていません。`s.memo rseed 数値` で設定してください。",
        allowedMentions: { repliedUser: false }
      });
    }

    return channel.send({
      content: `https://bc.godfat.org/?seed=${seed}&lang=jp`,
      allowedMentions: { repliedUser: false }
    });
  }

  // =================================================
  // 定型レス
  // =================================================
  if (text.endsWith("おもろい")) {
    return message.reply({ content: "りえ", allowedMentions: { repliedUser: false } });
  }

  if (text.endsWith("おもろ")) {
    return message.reply({ content: "いりえ", allowedMentions: { repliedUser: false } });
  }

  // =================================================
  // commands.json
  // =================================================
  if (text.startsWith("s.")) {
    const key = text.substring(2).trim();
    if (key in commands) {
      return message.reply({
        content: String(commands[key]),
        allowedMentions: { repliedUser: false }
      });
    }
  }

  // =================================================
  // s.memo / s.icon
  // =================================================
  if (text.startsWith("s.memo")) return handleMemoPrefix(message);
  if (text.startsWith("s.icon")) return handleIconPrefix(message);

  // =================================================
  // s.ut キャラ検索
  // =================================================
  if (!text.startsWith("s.ut")) return;
  if (!message.channel?.isTextBased()) return;

  const channel = message.channel;

  const keyword = text.slice(4).trim();
  if (!keyword) {
    await channel.send("検索語またはIDを指定してください");
    return;
  }

  const result = searchCharacter(keyword);

  if (result.length === 0) {
    await channel.send("該当するキャラが見つかりませんでした");
    return;
  }

  if (result.length === 1) {
    await channel.send(formatSingle(result[0]));
    return;
  }

  if (result.length <= 3) {
    await channel.send(formatMultiple(result));
    return;
  }

  if (result.length >= 10) {
    await channel.send(formatWithLimit(result, 10));
    return;
  }

  // 4～9件（リアクション選択）
  const msg = await channel.send(formatMultiple(result));

  for (let i = 0; i < result.length; i++) {
    await msg.react(NUMBER_EMOJIS[i]);
  }

  const filter = (reaction: any, user: any) =>
    typeof reaction.emoji.name === "string" &&
    NUMBER_EMOJIS.includes(reaction.emoji.name) &&
    user.id === message.author.id;

  try {
    const collected = await msg.awaitReactions({ filter, max: 1, time: 60_000 });
    const reaction = collected.first();
    if (!reaction || typeof reaction.emoji.name !== "string") return;

    const index = NUMBER_EMOJIS.indexOf(reaction.emoji.name);
    if (index < 0) return;

    const selected = result[index];
    if (!selected) return;

    await channel.send(`${selected.id} ${selected.names[0]}\n${selected.url}`);
  } finally {
    msg.reactions.removeAll().catch(() => {});
  }
}

