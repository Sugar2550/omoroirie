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

  if (!message.channel?.isTextBased()) return;
  if (!("send" in message.channel)) return;

  const channel = message.channel;
  const text = message.content;

  // =================================================
  // s.ut キャラ検索（最優先）
  // =================================================
  if (text.startsWith("s.ut")) {
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

    const msg = await channel.send(formatMultiple(result));

    for (let i = 0; i < result.length; i++) {
      await msg.react(NUMBER_EMOJIS[i]);
    }

    try {
      const collected = await msg.awaitReactions({
        filter: (reaction, user) =>
          NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") &&
          user.id === message.author.id,
        max: 1,
        time: 60_000
      });

      const reaction = collected.first();
      if (!reaction) return;

      const index = NUMBER_EMOJIS.indexOf(reaction.emoji.name!);
      const selected = result[index];

      if (selected) {
        await channel.send(
          `${selected.id} ${selected.names[0]}\n${selected.url}`
        );
      }
    } finally {
      msg.reactions.removeAll().catch(() => {});
    }
    return;
  }

  // =================================================
  // s.roll
  // =================================================
  if (text === "s.roll") {
    const seed = await callGAS("get", message.author.id, "rseed");

    if (!seed || seed === "NOT_FOUND") {
      await channel.send(
        "rseed が設定されていません。`s.memo rseed 数値` で設定してください。"
      );
      return;
    }

    await channel.send(`https://bc.godfat.org/?seed=${seed}&lang=jp`);
    return;
  }

  // =================================================
  // 定型レス
  // =================================================
  if (text.endsWith("おもろい")) {
    await channel.send("りえ");
    return;
  }

  if (text.endsWith("おもろ")) {
    await channel.send("いりえ");
    return;
  }

  // =================================================
  // s.memo / s.icon
  // =================================================
  if (text.startsWith("s.memo")) return handleMemoPrefix(message);
  if (text.startsWith("s.icon")) return handleIconPrefix(message);

  // =================================================
  // commands.json（最後）
  // =================================================
  if (text.startsWith("s.")) {
    const key = text.substring(2).trim();
    if (key in commands) {
      await channel.send(String(commands[key]));
      return;
    }
  }
}
