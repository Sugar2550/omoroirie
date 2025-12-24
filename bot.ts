import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";

import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { loadAllStages } from "./services/stage/stageRepository.js";
import { indexStages } from "./services/stage/stageSearch.js";

const stages = loadAllStages();
indexStages(stages);

console.log(`[stage] loaded ${stages.length} stages`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
  initStageSearch();
});

client.on("messageCreate", onMessageCreate);
client.on("interactionCreate", onInteractionCreate);

client.login(process.env.DISCORD_TOKEN!);
