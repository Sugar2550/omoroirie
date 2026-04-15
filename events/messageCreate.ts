import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo.js";
import { handleIconPrefix } from "../commands/icon.js";
import { callGAS } from "../services/gasClient.js";

import { searchCharacter } from "../services/characterSearch.js";
import { formatEnemySingle } from "../services/enemyFormat.js";
import { searchEnemy } from "../services/enemySearch.js";

import { searchMusic, MusicEntry } from "../services/musicSearch.js";

import {
  search,
  getStageUrl
 } from "../services/stage/stageSearch.js";
import {
  formatStageSingle,
  formatMapList
} from "../services/stage/stageFormat.js";

import commandsJson from "../commands/commands.json" with { type: "json" };
// 既知のコマンド名リストをインポート
import commandsNameJson from "../data/commandsName.json" with { type: "json" };

const commands = commandsJson as Record<string, string>;
const commandsNameList = commandsNameJson as string[];
const NUMBER_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

const allowedGuilds = (process.env.ALLOWED_FREE_PREFIX_GUILDS || "").split(",").map(id => id.trim());

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;
  if (!message.channel?.isTextBased()) return;
  if (!("send" in message.channel)) return;

  const channel = message.channel;
  const text = message.content.trim();
  const guildId = message.guildId;

  const startsWithS = text.startsWith("s.");
  const isFreePrefixServer = !!(guildId && allowedGuilds.includes(guildId));

  let cleanText = text;
  if (startsWithS) {
    cleanText = text.slice(2).trim();
  }

  const args = cleanText.split(/\s+/);
  const commandName = args[0].toLowerCase();

  const isKnownCommand = commandsNameList.includes(commandName) || commandName in commands;
  const isActualCommand = startsWithS || (isFreePrefixServer && isKnownCommand);

  // =================================================
  // コマンドではない場合の処理
  // =================================================
  if (!isActualCommand) {
    if (text.endsWith("おもろい")) {
      await channel.send("りえ");
      return;
    }
    if (text.endsWith("おもろ")) {
      await channel.send("いりえ");
      return;
    }
    return;
  }

  // =================================================
  // s.ut キャラ検索
  // =================================================
  if (commandName === "ut") {
    const utArgs = args.slice(1);
    if (utArgs.length === 0 || !utArgs[0]) {
      await channel.send("https://jarjarblink.github.io/JDB/unit_search.html?cc=ja");
      return;
    }

    const hasOrigin = utArgs.includes("origin");
    const form = utArgs.find(a => ["f", "c", "s", "u"].includes(a.toLowerCase()));
    const searchKeyword = utArgs.filter(a => {
      const l = a.toLowerCase();
      return l !== "origin" && !["f", "c", "s", "u"].includes(l);
    }).join(" ");

    const result = searchCharacter(searchKeyword);
    if (result.length === 0) {
      await channel.send("該当するキャラが見つかりませんでした");
      return;
    }

    const pureWordCount = utArgs.filter(a => {
      const l = a.toLowerCase();
      return l !== "origin" && !["f", "c", "s", "u"].includes(l);
    }).length;

    if (hasOrigin && pureWordCount === 1) {
      const c = result[0];
      const paddedId = String(c.id).padStart(3, "0");
      const targetForm = form ? form.toLowerCase() : "f";
      const imageUrl = `https://jarjarblink.github.io/JDB/static/img/unit_icon/uni${paddedId}_${targetForm}00.png`;
      await channel.send(`${c.id} ${c.names[0]}\n${imageUrl}`);
      return;
    }

    if (result.length > 20) {
      const block = "```" + result.slice(0, 20).map(c => `${c.id} ${c.names[0]}`).join("\n") + "```\n…more";
      await channel.send(block);
      return;
    }

    if (result.length >= 10) {
      const block = "```" + result.map(c => `${c.id} ${c.names[0]}`).join("\n") + "```";
      await channel.send(block);
      return;
    }

    if (result.length <= 3) {
      for (const c of result) await channel.send(`${c.id} ${c.names[0]}\n${c.url}`);
      return;
    }

    const listBlockWithNum = "```\n" + result.map((c, i) => `${NUMBER_EMOJIS[i]} ${c.id} ${c.names[0]}`).join("\n") + "\n```";
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
  if (commandName === "tut") {
    const tutArgs = args.slice(1);
    if (tutArgs.length === 0 || !tutArgs[0]) {
      await channel.send("https://jarjarblink.github.io/JDB/tunit_search.html?cc=ja");
      return;
    }

    const hasOrigin = tutArgs.includes("origin");
    const searchKeyword = tutArgs.filter(a => a.toLowerCase() !== "origin").join(" ");

    const result = searchEnemy(searchKeyword);
    if (result.length === 0) {
      await channel.send("該当する敵キャラが見つかりませんでした");
      return;
    }

    const pureWordCount = tutArgs.filter(a => a.toLowerCase() !== "origin").length;

    if (hasOrigin && pureWordCount === 1) {
      const e = result[0];
      const paddedId = String(e.id).padStart(3, "0");
      const imageUrl = `https://ponosgames.com/information/appli/battlecats/stage/img/enemy/enemy_icon_${paddedId}.png`;
      await channel.send(`${e.id} ${e.names[0]}\n${imageUrl}`);
      return;
    }

    if (result.length > 20) {
      const block = "```" + result.slice(0, 20).map(e => `${e.id} ${e.names[0]}`).join("\n") + "```\n…more";
      await channel.send(block);
      return;
    }

    if (result.length >= 10) {
      const block = "```" + result.map(e => `${e.id} ${e.names[0]}`).join("\n") + "```";
      await channel.send(block);
      return;
    }

    if (result.length <= 3) {
      for (const e of result) await channel.send(formatEnemySingle(e));
      return;
    }

    const listBlockWithNum = "```\n" + result.map((e, i) => `${NUMBER_EMOJIS[i]} ${e.id} ${e.names[0]}`).join("\n") + "\n```";
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
  if (commandName === "st") {
    const stArgs = args.slice(1);
    if (stArgs.length === 0 || !stArgs[0]) {
      await channel.send("https://jarjarblink.github.io/JDB/map_search.html?cc=ja");
      return;
    }

    const hasOrigin = stArgs.includes("origin");
    const searchKeyword = stArgs.filter(arg => arg.toLowerCase() !== "origin").join(" ");
    
    const { stages, maps } = search(searchKeyword);
    const results = [
      ...maps.map(m => ({ type: "map" as const, data: m })),
      ...stages.map(s => ({ type: "stage" as const, data: s }))
    ];

    if (results.length === 0) {
      await channel.send("該当するステージが見つかりませんでした");
      return;
    }

    if (hasOrigin && stArgs.filter(a => a.toLowerCase() !== "origin").length === 1) {
      const picked = results[0];
      const idStr = picked.type === "stage" ? picked.data.stageId : picked.data.mapId;
      const nameStr = picked.type === "stage" ? picked.data.stageName : picked.data.mapName;

      if (!idStr.includes("-")) {
        const originUrl = `https://ponosgames.com/information/appli/battlecats/stage/${idStr}.html`;
        await channel.send(`${idStr} ${nameStr}\n${originUrl}`);
        return;
      }
    }

    if (results.length > 20) {
      const listText = "```" + results.slice(0, 20).map(r => {
        const idStr = r.type === "stage" ? r.data.stageId : r.data.mapId;
        const nameStr = r.type === "stage" ? r.data.stageName : r.data.mapName;
        return `${idStr} ${nameStr}`;
      }).join("\n") + "```\n…more";
      await channel.send(listText);
      return;
    }

    if (results.length >= 10) {
      const listText = "```\n" + results.map(r => {
        const idStr = r.type === "stage" ? r.data.stageId : r.data.mapId;
        const nameStr = r.type === "stage" ? r.data.stageName : r.data.mapName;
        return `${idStr} ${nameStr}`;
      }).join("\n") + "```";
      await channel.send(listText);
      return;
    }

    if (results.length <= 3) {
      for (const r of results) {
        const idStr = r.type === "stage" ? r.data.stageId : r.data.mapId;
        const nameStr = r.type === "stage" ? r.data.stageName : r.data.mapName;
        await channel.send(`${idStr} ${nameStr}\n${getStageUrl(idStr)}`);
      }
      return;
    }

    const listTextWithNum = "```" + results.map((r, i) => {
      const idStr = r.type === "stage" ? r.data.stageId : r.data.mapId;
      const nameStr = r.type === "stage" ? r.data.stageName : r.data.mapName;
      return `${NUMBER_EMOJIS[i]} ${idStr} ${nameStr}`;
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
        await channel.send(`${idStr} ${nameStr}\n${getStageUrl(idStr)}`);
      }
      await msg.reactions.removeAll().catch(() => {});
    });
    return;
  }
  // =================================================
  // s.roll
  // =================================================
  if (commandName === "roll") {
    const subCommand = args[1];

    let seed = "1";
    let showGuide = false;

    if (!subCommand) {
      seed = "1";
      showGuide = true;
    } else if (/^\d+$/.test(subCommand)) {
      seed = subCommand;
    } else if (subCommand === "m") {
      const savedSeed = await callGAS("get", message.author.id, "rseed");
      const isInvalid = !savedSeed || savedSeed === "NOT_FOUND" || savedSeed === "メモがありません";
      
      seed = isInvalid ? "1" : savedSeed;
      showGuide = isInvalid;
    } else {
      seed = "1";
      showGuide = true;
    }

    let response = `https://bc.godfat.org/?seed=${seed}&lang=jp`;
    if (showGuide) {
      response += "\n`s.memo rseed seed値`でseedを登録してください。`s.roll m`で登録した値を使用できます。";
    }

    await channel.send(response);
    return;
  }

  // =================================================
  // s.music 曲プレイリスト生成
  // =================================================
  if (commandName === "music") {
    const toHalfWidth = (str: string) => str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
    const rawArgs = args.slice(1).map(arg => toHalfWidth(arg));

    if (rawArgs.length === 0) {
      await channel.send("https://bc-music.vercel.app/");
      return;
    }

    const isOgg = rawArgs.includes("ogg");
    const searchWord = rawArgs.filter(arg => arg !== "ogg").join(" ");

    const musicResults = searchMusic(searchWord);

    const sendMusicMessage = async (entry: { id: number, names: string[] }, playlist: number[]) => {
      const finalIds = playlist.map(id => isOgg ? id + 1000 : id);
      const url = `https://bc-music.vercel.app/playlist.html?sd=${finalIds.join(",")}`;
      await channel.send(`${entry.id} ${entry.names[0]}\n${url}`);
    };

    const sendDirectUrl = async (ids: number[]) => {
      const url = `https://bc-music.vercel.app/playlist.html?sd=${ids.join(",")}`;
      await channel.send(url);
    };
    if (musicResults.length >= 10) {
      const listText = "```\n" + musicResults.slice(0, 20).map((m: MusicEntry) => `${m.id} ${m.names[0]}`).join("\n") + "```" + (musicResults.length > 20 ? "\n…more" : "");
      await channel.send(listText);
      return;
    }

    // 2. 2〜9件ヒット（リアクション選択）
    if (musicResults.length >= 2) {
      const listTextWithNum = "```\n" + musicResults.map((m: MusicEntry, i: number) => {
        return `${NUMBER_EMOJIS[i]} ${m.id} ${m.names[0]}`;
      }).join("\n") + "\n```";

      const msg = await channel.send(listTextWithNum);
      for (let i = 0; i < musicResults.length; i++) await msg.react(NUMBER_EMOJIS[i]);

      const collector = msg.createReactionCollector({
        filter: (reaction, user) => NUMBER_EMOJIS.includes(reaction.emoji.name ?? "") && user.id === message.author.id,
        max: 1, time: 30_000
      });

      collector.on("collect", async (reaction) => {
        const index = NUMBER_EMOJIS.indexOf(reaction.emoji.name!);
        const picked = musicResults[index];
        if (picked) {
          await sendMusicMessage(picked, picked.playlist);
        }
        await msg.reactions.removeAll().catch(() => {});
      });
      return;
    }

    // 3. 1件ヒット：即座に送信
    if (musicResults.length === 1) {
      await sendMusicMessage(musicResults[0], musicResults[0].playlist);
      return;
    }

    // 4. ヒットなし：直接数値入力（後方互換性）
    const directIds = rawArgs
      .filter(arg => /^\d+$/.test(arg))
      .map(id => {
        const num = parseInt(id, 10);
        return isOgg ? num + 1000 : num;
      });

    if (directIds.length > 0) {
      // 複数の数値入力（例: s.music 1 2 3）の場合は名前が特定できないためURLのみ
      await sendDirectUrl(directIds);
    } else {
      await channel.send("該当する曲やプレイリストが見つかりませんでした。");
    }
    return;
  }

 // =================================================
  // s.memo / s.icon
  // =================================================
  if (commandName === "bb") return handleMemoPrefix(message, args.slice(1));
  if (commandName === "memo") return handleMemoPrefix(message, args.slice(1));
  if (commandName === "icon") return handleIconPrefix(message);

  // =================================================
  // commands.json（最後）
  // =================================================
  if (commandName in commands) {
    await channel.send(String(commands[commandName]));
    return;
  }
}