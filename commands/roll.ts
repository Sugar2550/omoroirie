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
    return interaction.channel.send({
      content: "rseed が設定されていません。`s.memo rseed 数値` で設定してください。",
      ephemeral: true
    });
  }

  return interaction.channel.send({
    content: `https://bc.godfat.org/?seed=${seed}&lang=jp`
  });
}
