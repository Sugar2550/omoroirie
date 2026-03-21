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
  const seed = await callGAS("get", interaction.user.id, "rseed");

  if (!seed || seed === "NOT_FOUND") {
    return interaction.reply({
      content: "https://bc.godfat.org/?seed=1&lang=jp\n`s.memo rseed シード値`でseed値を登録してください"
    });
  }

  return interaction.reply({
    content: `https://bc.godfat.org/?seed=${seed}&lang=jp`
  });
}
