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

import { searchEnemy } from "../services/enemySearch.js";
import {
  formatEnemySingle,
  formatEnemyMultiple,
  formatEnemyWithLimit
} from "../services/enemyFormat.js";

import { StageEntry } from "../services/stage/stageTypes.js";
import { search } from "../services/stage/stageSearch.js";
import {
  formatStageSingle,
  formatStageList,
  formatMapList
} from "../services/stage/stageFormat.js";

import commandsJson from "../commands/commands.json" with { type: "json" };

const commands = commandsJson as Record<string, string>;
const NUMBER_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;
  if (!message.channel?.isTextBased()) return;
  if (!("send" in message.channel)) return;

  const channel = message.channel;
  const text = message.content;
  const isCommand = text.startsWith("s.");

  // =================================================
  // s.ut キャラ検索
  // =================================================
  if (text.startsWith("s.ut")) {
    const keyword = text.slice(4).trim();

    if (!keyword) {
      await channel.send(
        "https://jarjarblink.github.io/JDB/unit_search.html?cc=ja"
      );
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

    if (result.length === 1) {
      const c = result[0];
      await channel.send(listBlock);
      await channel.send(`${c.id} ${c.names[0]}\n${c.url}`);
      return;
    }

    if (result.length <= 3) {
      await channel.send(listBlock);
      await channel.send(
        result.map(c => `${c.id} ${c.names[0]}\n${c.url}`).join("\n")
      );
      return;
    }

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

    const msg = await channel.send(listBlock);

    for (let i = 0; i < result.length; i++) {
      await msg.react(NUMBER_EMOJIS[i]);
    }

    const collector = msg.createReactionCollector({
      filter: (reaction, user) =>
        NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") &&
        user.id === message.author.id,
      max: 1,
      time: 60_000
    });

    collector.on("collect", async reaction => {
      const index = NUMBER_EMOJIS.indexOf(reaction.emoji.name!);
      const selected = result[index];

      if (selected) {
        await channel.send(
          `${selected.id} ${selected.names[0]}\n${selected.url}`
        );
      }

      await msg.reactions.removeAll().catch(() => {});
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        await msg.reactions.removeAll().catch(() => {});
      }
    });
    return;
  }

  // =================================================
  // s.tut 敵キャラ検索
  // =================================================
  if (text.startsWith("s.tut")) {
    const keyword = text.slice(5).trim();

    if (!keyword) {
      await channel.send(
        "https://jarjarblink.github.io/JDB/tunit_search.html?cc=ja"
      );
      return;
    }

    const result = searchEnemy(keyword);

    if (result.length === 0) {
      await channel.send("該当する敵キャラが見つかりませんでした");
      return;
    }

    const listBlock = formatEnemyMultiple(result);

    if (result.length === 1) {
      await channel.send(listBlock);
      await channel.send(formatEnemySingle(result[0]));
      return;
    }

    if (result.length <= 3) {
      await channel.send(listBlock);
      await channel.send(result.map(formatEnemySingle).join("\n"));
      return;
    }

    if (result.length >= 10) {
      await channel.send(formatEnemyWithLimit(result, 10));
      return;
    }

    const msg = await channel.send(listBlock);

    for (let i = 0; i < result.length; i++) {
      await msg.react(NUMBER_EMOJIS[i]);
    }

    const collector = msg.createReactionCollector({
      filter: (reaction, user) =>
        NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") &&
        user.id === message.author.id,
      max: 1,
      time: 60_000
    });

    collector.on("collect", async reaction => {
      const index = NUMBER_EMOJIS.indexOf(reaction.emoji.name!);
      const selected = result[index];

      if (selected) {
        await channel.send(formatEnemySingle(selected));
      }

      await msg.reactions.removeAll().catch(() => {});
    });

    collector.on("end", async () => {
      await msg.reactions.removeAll().catch(() => {});
    });

    return;
  }

  // =================================================
  // s.st ステージ検索
  // =================================================
  if (text.startsWith("s.st")) {
    const keyword = text.slice(4).trim();

    if (!keyword) {
      await channel.send(
        "https://jarjarblink.github.io/JDB/map_search.html?cc=ja"
      );
      return;
    }

    const { stages, maps } = search(keyword);

    const results = [
      ...maps.map(m => ({ type: "map" as const, data: m })),
      ...stages.map(s => ({ type: "stage" as const, data: s }))
    ];

    if (results.length === 0) {
      await channel.send("該当するステージが見つかりませんでした");
      return;
    }

    const MAX = 10;
    const shown = results.slice(0, MAX);

    if (shown.length <= 3) {
      for (const r of shown) {
        if (r.type === "stage") {
          await channel.send(formatStageSingle(r.data));
        } else {
          await channel.send(formatMapList([r.data]));
        }
      }
      return;
    }

    if (shown.length <= 9) {
      const listText =
        "```" +
        shown
          .map((r, i) =>
            r.type === "stage"
              ? `${i + 1}. ${r.data.stageId} ${r.data.stageName}`
              : `${i + 1}. ${r.data.mapId} ${r.data.mapName}`
          )
          .join("\n") +
        "```";

      const msg = await channel.send(listText);

      for (let i = 0; i < shown.length; i++) {
        await msg.react(NUMBER_EMOJIS[i]);
      }

      const collector = msg.createReactionCollector({
        filter: (reaction, user) =>
          !!reaction.emoji.name &&
          NUMBER_EMOJIS.includes(reaction.emoji.name) &&
          user.id === message.author.id,
        max: 1,
        time: 60_000
      });

      collector.on("collect", async reaction => {
        const index = NUMBER_EMOJIS.indexOf(reaction.emoji.name!);
        const picked = shown[index];
        if (!picked) return;

        if (picked.type === "stage") {
          await channel.send(formatStageSingle(picked.data));
        } else {
          await channel.send(formatMapList([picked.data]));
        }
      });

      collector.on("end", async () => {
        try {
          if (msg.editable) {
            await msg.reactions.removeAll();
          }
        } catch {}
      });

      return;
    }
      let text = "";

      if (stageResults.length > 0) {
        text += formatStageList(stageResults);
      }

      if (mapResults.length > 0) {
        if (text) text += "\n";
        text += formatMapList(mapResults);
      }

      text += "\n…more";

      await channel.send(text);
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
  // 定型レス（コマンド時は反応しない）
  // =================================================
  if (!isCommand) {
    if (text.endsWith("おもろい")) {
      await channel.send("りえ");
      return;
    }

    if (text.endsWith("おもろ")) {
      await channel.send("いりえ");
      return;
    }
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
