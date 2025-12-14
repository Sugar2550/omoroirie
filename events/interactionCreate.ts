import { Interaction } from "discord.js";
import { handleMemoSlash } from "../commands/memo.js";
import { handleIconSlash } from "../commands/icon.js";
import { handleRollSlash } from "../commands/roll.js";

export async function onInteractionCreate(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  const commandName = interaction.commandName;

  if (commandName === "memo") {
    return handleMemoSlash(interaction);
  }

  if (commandName === "icon") {
    return handleIconSlash(interaction);
  }

  if (commandName === "roll") {
    return handleRollSlash(interaction);
  }
}
