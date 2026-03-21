import {
  ChatInputCommandInteraction,
  SlashCommandBuilder
} from "discord.js";
import { callGAS } from "../services/gasClient.js";

export const rollSlashCommand = new SlashCommandBuilder()
  .setName("roll")
  .setDescription("URLを生成します")
  .addStringOption(option =>
    option.setName("value")
      .setDescription("数値、または保存した値を使う場合は 'm' を入力")
      .setRequired(false)
  )
  .toJSON();

export async function handleRollSlash(
  interaction: ChatInputCommandInteraction
) {
  const subCommand = interaction.options.getString("value");

  let seed = "1";
  let showGuide = false;

  if (!subCommand) {
    seed = "1";
    showGuide = true;
  } else if (/^\d+$/.test(subCommand)) {
    seed = subCommand;
  } else if (subCommand === "m") {
    const savedSeed = await callGAS("get", interaction.user.id, "rseed");
    const isInvalid = !savedSeed || savedSeed === "NOT_FOUND" || savedSeed === "メモがありません";
    
    seed = isInvalid ? "1" : savedSeed;
    showGuide = isInvalid;
  } else {
    seed = "1";
    showGuide = true;
  }

  let response = `https://bc.godfat.org/?seed=${seed}&lang=jp`;
  if (showGuide) {
    response += "\n`s.memo rseed seed値`でseedを登録してください。`/roll value:m`で登録した値を使用できます。";
  }

  return interaction.reply({ content: response });
}