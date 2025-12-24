import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";

import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";
import { initStageSearch } from "./services/stage/stageLoader.js";

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
