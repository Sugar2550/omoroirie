import {
  ChatInputCommandInteraction,
  SlashCommandBuilder
} from "discord.js";
import { callGAS } from "../services/gasClient.js";

export const rollSlashCommand = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("保存されている rseed を使ってURLを生成します")
  .toJSON();

export async function handleRollSlash(
  interaction: ChatInputCommandInteraction
) {
  let seed = await callGAS("get", interaction.user.id, "rseed");

  if (!seed || seed === "NOT_FOUND") {
    seed = "1";
  }

  return interaction.reply({
    content: `https://bc.godfat.org/?seed=${seed}&lang=jp`
  });
}
