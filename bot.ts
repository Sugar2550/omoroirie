import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import "dotenv/config";

import { onMessageCreate } from "./events/messageCreate";
import { onInteractionCreate } from "./events/interactionCreate";

import { memoSlashCommand } from "./commands/memo";
import { iconSlashCommand } from "./commands/icon";

const TOKEN = process.env.DISCORD_TOKEN!;
const APP_ID = process.env.DISCORD_APPLICATION_ID!;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

// event handlers
client.on("messageCreate", onMessageCreate);
client.on("interactionCreate", onInteractionCreate);

// slash command deploy
async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(Routes.applicationCommands(APP_ID), {
    body: [memoSlashCommand, iconSlashCommand]
  });

  console.log("Slash commands deployed");
}

deployCommands();
client.login(TOKEN);