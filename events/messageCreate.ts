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
    const args = text.slice(4).trim().split(/\s+/);
    if (args.length === 0 || !args[0]) {
      await channel.send("https://jarjarblink.github.io/JDB/unit_search.html?cc=ja");
      return;
    }

    const hasOrigin = args.includes("origin");
    // 形態指定オプション(f,c,s,u)を抽出
    const form = args.find(a => ["f", "c", "s", "u"].includes(a.toLowerCase()));
    
    // 検索ワード：origin と 形態指定文字 を除外して結合
    const searchKeyword = args.filter(a => {
      const l = a.toLowerCase();
      return l !== "origin" && !["f", "c", "s", "u"].includes(l);
    }).join(" ");

    // AND検索対応の検索関数を呼び出し
    const result = searchCharacter(searchKeyword);
    if (result.length === 0) {
      await channel.send("該当するキャラが見つかりませんでした");
      return;
    }

    // --- originオプション判定 ---
    // 単一のID/ワード指定 かつ originがある場合のみ公式画像を出力
    const pureWordCount = args.filter(a => {
      const l = a.toLowerCase();
      return l !== "origin" && !["f", "c", "s", "u"].includes(l);
    }).length;

    if (hasOrigin && pureWordCount === 1) {
      const c = result[0];
      const paddedId = String(c.id).padStart(3, "0");
      const validForms = ["f", "c", "s", "u"];
      const targetForm = (form && validForms.includes(form)) ? form : "f";
      const imageUrl = `https://ponosgames.com/information/appli/battlecats/gacha/img/chara_icon/uni${paddedId}_${targetForm}00.png`;
      await channel.send(`${c.id} ${c.names[0]}\n${imageUrl}`);
      return;
    }

    // --- 既存のロジック（検索結果を表示） ---
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
    const args = text.slice(5).trim().split(/\s+/);
    if (args.length === 0 || !args[0]) {
      await channel.send("https://jarjarblink.github.io/JDB/tunit_search.html?cc=ja");
      return;
    }

    const hasOrigin = args.includes("origin");
    // 検索ワード：origin を除外して結合
    const searchKeyword = args.filter(a => a.toLowerCase() !== "origin").join(" ");

    const result = searchEnemy(searchKeyword);
    if (result.length === 0) {
      await channel.send("該当する敵キャラが見つかりませんでした");
      return;
    }

    // --- originオプション判定 ---
    const pureWordCount = args.filter(a => a.toLowerCase() !== "origin").length;

    if (hasOrigin && pureWordCount === 1) {
      const e = result[0];
      const paddedId = String(e.id).padStart(3, "0");
      const imageUrl = `https://ponosgames.com/information/appli/battlecats/stage/img/enemy/enemy_icon_${paddedId}.png`;
      await channel.send(`${e.id} ${e.names[0]}\n${imageUrl}`);
      return;
    }

    // --- 既存のロジック ---
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
    const rawArgs = text.slice(4).trim();
    if (!rawArgs) {
      await channel.send("https://jarjarblink.github.io/JDB/map_search.html?cc=ja");
      return;
    }

    // スペースで分割して origin オプションを確認
    const args = rawArgs.split(/\s+/);
    const hasOrigin = args.includes("origin");
    
    // 検索用キーワード：origin を除いたすべてのワードを結合（AND検索のため）
    const searchKeyword = args.filter(arg => arg.toLowerCase() !== "origin").join(" ");
    
    // 検索実行
    const { stages, maps } = search(searchKeyword);
    const results = [
      ...maps.map(m => ({ type: "map" as const, data: m })),
      ...stages.map(s => ({ type: "stage" as const, data: s }))
    ];

    if (results.length === 0) {
      await channel.send("該当するステージが見つかりませんでした");
      return;
    }

    // --- 【追加】originオプション判定 ---
    // 条件：originが指定されている かつ 検索ワードが1つ（ID指定）であること
    if (hasOrigin && args.filter(a => a.toLowerCase() !== "origin").length === 1) {
      const picked = results[0];
      const idStr = picked.type === "stage" ? picked.data.stageId : picked.data.mapId;
      const nameStr = picked.type === "stage" ? picked.data.stageName : picked.data.mapName;

      // ハイフンが含まれる場合は生成しない（マップIDのみを対象とする）
      if (!idStr.includes("-")) {
        const originUrl = `https://ponosgames.com/information/appli/battlecats/stage/${idStr}.html`;
        await channel.send(`${idStr} ${nameStr}\n${originUrl}`);
        return;
      }
    }

    // --- 出力ロジック ---
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