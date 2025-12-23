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
  // s.ut キャラ検索
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

    const listBlock =
      "```" +
      result.map(c => `${c.id} ${c.names[0]}`).join("\n") +
      "```";

    // ---- 1件 ----
    if (result.length === 1) {
      const c = result[0];
      await channel.send(listBlock);
      await channel.send(`${c.id} ${c.names[0]}\n${c.url}`);
      return;
    }
  
    // ---- 2～3件 ----
    if (result.length <= 3) {
      await channel.send(listBlock);

      const detailText = result
        .map(c => `${c.id} ${c.names[0]}\n${c.url}`)
        .join("\n");

      await channel.send(detailText);
      return;
    }

    // ---- 10件以上 ----
    if (result.length >= 10) {
      const limited = result.slice(0, 10);
      const block =
        "```" +
        limited.map(c => `${c.id} ${c.names[0]}`).join("\n") +
        "\n...more" +
        "```";

      await channel.send(block);
      return;
    }

    // ---- 4～9件（リアクション選択） ----
    const msg = await channel.send(listBlock);

    // リアクション付与
    for (let i = 0; i < result.length; i++) {
      await msg.react(NUMBER_EMOJIS[i]);
    }

    // コレクタ作成
    const collector = msg.createReactionCollector({
      filter: (reaction, user) =>
        NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") &&
        user.id === message.author.id,
      max: 1,
      time: 60_000
    });

    // リアクションされた瞬間
    collector.on("collect", async reaction => {
      const index = NUMBER_EMOJIS.indexOf(reaction.emoji.name!);
      const selected = result[index];

      if (selected) {
        await channel.send(
          `${selected.id} ${selected.names[0]}\n${selected.url}`
        );
      }

      // 即時リアクション削除
      await msg.reactions.removeAll().catch(() => {});
    });

    // 1分経過 or max 到達
    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        // タイムアウト時もリアクション全削除
        await msg.reactions.removeAll().catch(() => {});
      }
    });


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
