import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";

import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";

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


// =================================================
// Discord Client
// =================================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.on("messageCreate", onMessageCreate);
client.on("interactionCreate", onInteractionCreate);

client.login(process.env.DISCORD_TOKEN);

