import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";

import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";

import { loadAllStages } from "./services/stage/stageRepository.js";
import { indexStages } from "./services/stage/stageSearch.js";

// =================================================
// ステージ初期化（起動時に1回だけ）
// =================================================
const stages = loadAllStages();
indexStages(stages);

console.log(`[stage] loaded ${stages.length} stages`);

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

