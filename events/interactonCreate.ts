import { Interaction } from "discord.js";
import { handleMemoSlash } from "../commands/memo.js";
import { handleIconSlash } from "../commands/icon.js";

export async function onInteractionCreate(interaction: Interaction) {
  // ChatInput (slash) command のみ処理
  if (!interaction.isChatInputCommand || !interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;

  if (commandName === "memo") {
    // handleMemoSlash は ChatInputCommandInteraction を受け取ります
    return handleMemoSlash(interaction);
  }

  if (commandName === "icon") {
    return handleIconSlash(interaction);
  }
}