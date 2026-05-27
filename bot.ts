import { Client, GatewayIntentBits, Partials } from "discord.js";
import "dotenv/config";

import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { onGuildCreate } from "./events/guildCreate.js";

import { loadAll } from "./services/stage/stageRepository.js";
import { indexAll, search } from "./services/stage/stageSearch.js";

// =================================================
// ステージ / マップ 初期化（起動時に1回だけ）
// =================================================
const { stages, maps } = loadAll();
indexAll({ stages, maps });

console.log(
  `[stage] loaded ${stages.length} stages / ${maps.length} maps`
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages 
  ],
  partials: [Partials.Channel] 
});

client.once("clientReady", () => {
  console.log(`[bot] Logged in as ${client.user?.tag}`);
  console.log("--- 導入されているサーバー一覧 ---");
  client.guilds.cache.forEach(guild => {
    console.log(`サーバー名: ${guild.name} | ID: ${guild.id}`);
  });
  console.log("---------------------------------");
});

// =================================================
// イベントハンドラーの登録
// =================================================
client.on("messageCreate", onMessageCreate);
client.on("interactionCreate", onInteractionCreate);
// ↓ ここで先ほど作った onGuildCreate を登録します
client.on("guildCreate", onGuildCreate);

client.login(process.env.DISCORD_TOKEN);

const gasUrl = process.env.GAS_WEBAPP_URL;