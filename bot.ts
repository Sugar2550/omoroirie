import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import "dotenv/config";

import { onMessageCreate } from "./events/messageCreate.js";
import { onInteractionCreate } from "./events/interactionCreate.js";

import { memoSlashCommand } from "./commands/memo.js";
import { iconSlashCommand } from "./commands/icon.js";
import { rollSlashCommand } from "./commands/roll.js";

// ★ 追加：ステージ検索初期化
import { initStageSearch } from "./services/stage/stageLoader.js";

const TOKEN = process.env.DISCORD_TOKEN!;
const APP_ID = process.env.DISCORD_APPLICATION_ID!;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

client.on("ready", () => {
  // ★ ここで一度だけインデックス構築
  initStageSearch();

  console.log(`Logged in as ${client.user?.tag}`);
});

// event handlers
client.on("messageCreate", onMessageCreate);
client.on("interactionCreate", onInteractionCreate);

// slash command deploy
async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(Routes.applicationCommands(APP_ID), {
    body: [memoSlashCommand, iconSlashCommand, rollSlashCommand]
  });

  console.log("Slash commands deployed");
}

deployCommands();
client.login(TOKEN);
