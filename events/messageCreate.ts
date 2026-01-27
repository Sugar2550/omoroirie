import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo.js";
import { handleIconPrefix } from "../commands/icon.js";
import { callGAS } from "../services/gasClient.js";

import { searchCharacter } from "../services/characterSearch.js";
import { formatEnemySingle } from "../services/enemyFormat.js";
import { searchEnemy } from "../services/enemySearch.js";

import { search } from "../services/stage/stageSearch.js";
import {
  formatStageSingle,
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
  const isCommand = text.startsWith("s.") || text.startsWith("st") || text.startsWith("k.");

  // =================================================
  // s.ut キャラ検索
  // =================================================
  if (text.startsWith("s.ut")) {
    const keyword = text.slice(4).trim();
    if (!keyword) {
      await channel.send("https://jarjarblink.github.io/JDB/unit_search.html?cc=ja");
      return;
    }

    const result = searchCharacter(keyword);
    if (result.length === 0) {
      await channel.send("該当するキャラが見つかりませんでした");
      return;
    }

    if (result.length >= 10) {
      const block = "```" + result.slice(0, 10).map(c => `${c.id} ${c.names[0]}`).join("\n") + "```\n…more";
      await channel.send(block);
      return;
    }

    if (result.length <= 3) {
      for (const c of result) await channel.send(`${c.id} ${c.names[0]}\n${c.url}`);
      return;
    }

    const listBlockWithNum = "```" + result.map((c, i) => `${i + 1}. ${c.id} ${c.names[0]}`).join("\n") + "```";
    const msg = await channel.send(listBlockWithNum);
    for (let i = 0; i < result.length; i++) await msg.react(NUMBER_EMOJIS[i]);

    const collector = msg.createReactionCollector({
      filter: (reaction, user) => NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") && user.id === message.author.id,
      max: 1, time: 60_000
    });

    collector.on("collect", async reaction => {
      const selected = result[NUMBER_EMOJIS.indexOf(reaction.emoji.name!)];
      if (selected) await channel.send(`${selected.id} ${selected.names[0]}\n${selected.url}`);
      await msg.reactions.removeAll().catch(() => {});
    });
    return;
  }

  // =================================================
  // s.tut 敵キャラ検索
  // =================================================
  if (text.startsWith("s.tut")) {
    const keyword = text.slice(5).trim();
    if (!keyword) {
      await channel.send("https://jarjarblink.github.io/JDB/tunit_search.html?cc=ja");
      return;
    }

    const result = searchEnemy(keyword);
    if (result.length === 0) {
      await channel.send("該当する敵キャラが見つかりませんでした");
      return;
    }

    if (result.length >= 10) {
      const block = "```" + result.slice(0, 10).map(e => `${e.id} ${e.names[0]}`).join("\n") + "```\n…more";
      await channel.send(block);
      return;
    }

    if (result.length <= 3) {
      for (const e of result) await channel.send(formatEnemySingle(e));
      return;
    }

    const listBlockWithNum = "```" + result.map((e, i) => `${i + 1}. ${e.id} ${e.names[0]}`).join("\n") + "```";
    const msg = await channel.send(listBlockWithNum);
    for (let i = 0; i < result.length; i++) await msg.react(NUMBER_EMOJIS[i]);

    const collector = msg.createReactionCollector({
      filter: (reaction, user) => NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") && user.id === message.author.id,
      max: 1, time: 60_000
    });

    collector.on("collect", async reaction => {
      const selected = result[NUMBER_EMOJIS.indexOf(reaction.emoji.name!)];
      if (selected) await channel.send(formatEnemySingle(selected));
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
      await channel.send("https://jarjarblink.github.io/JDB/map_search.html?cc=ja");
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

    if (results.length >= 10) {
      const listText = "```" + results.slice(0, 10).map(r => {
        const idStr = r.type === "stage" ? r.data.stageId : r.data.mapId;
        const nameStr = r.type === "stage" ? r.data.stageName : r.data.mapName;
        return `${idStr} ${nameStr}`;
      }).join("\n") + "```\n…more";
      await channel.send(listText);
      return;
    }

    // --- 詳細出力：ut, tut と同じプレーンテキスト形式 ---
    if (results.length <= 3) {
      for (const r of results) {
        const idStr = r.type === "stage" ? r.data.stageId : r.data.mapId;
        const nameStr = r.type === "stage" ? r.data.stageName : r.data.mapName;
        
        // URLを直接組み立てる (ビルドエラー回避)
        const baseUrl = "https://jarjarblink.github.io/JDB/map.html?cc=ja";
        const url = r.type === "stage" 
          ? `${baseUrl}&type=${r.data.stageId.split(/\d/)[0]}&map=${parseInt(r.data.stageId.match(/\d+/)?.[0] || "0")}`
          : `${baseUrl}&type=${r.data.mapId.split(/\d/)[0]}&map=${parseInt(r.data.mapId.match(/\d+/)?.[0] || "0")}`;

        await channel.send(`${idStr} ${nameStr}\n${url}`);
      }
      return;
    }

    const listTextWithNum = "```" + results.map((r, i) => {
      const idStr = r.type === "stage" ? r.data.stageId : r.data.mapId;
      const nameStr = r.type === "stage" ? r.data.stageName : r.data.mapName;
      return `${i + 1}. ${idStr} ${nameStr}`;
    }).join("\n") + "```";

    const msg = await channel.send(listTextWithNum);
    for (let i = 0; i < results.length; i++) await msg.react(NUMBER_EMOJIS[i]);

    const collector = msg.createReactionCollector({
      filter: (reaction, user) => NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") && user.id === message.author.id,
      max: 1, time: 60_000
    });

    collector.on("collect", async reaction => {
      const picked = results[NUMBER_EMOJIS.indexOf(reaction.emoji.name!)];
      if (picked) {
        const idStr = picked.type === "stage" ? picked.data.stageId : picked.data.mapId;
        const nameStr = picked.type === "stage" ? picked.data.stageName : picked.data.mapName;
        
        const baseUrl = "https://jarjarblink.github.io/JDB/map.html?cc=ja";
        const url = picked.type === "stage"
          ? `${baseUrl}&type=${picked.data.stageId.split(/\d/)[0]}&map=${parseInt(picked.data.stageId.match(/\d+/)?.[0] || "0")}`
          : `${baseUrl}&type=${picked.data.mapId.split(/\d/)[0]}&map=${parseInt(picked.data.mapId.match(/\d+/)?.[0] || "0")}`;

        await channel.send(`${idStr} ${nameStr}\n${url}`);
      }
      await msg.reactions.removeAll().catch(() => {});
    });
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