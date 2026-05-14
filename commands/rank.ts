import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { callGAS } from "../services/gasClient.js";

export const rankSlashCommand = {
  name: "rank",
  description: "このサーバーの「おもろいりえ」ランキングを表示します",
};

export async function handleRankSlash(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", ephemeral: true });
  }

  await interaction.deferReply();

  try {
    const serverKey = `omoroirie_${interaction.guildId}`;
    const result = await callGAS("getRank", interaction.user.id, serverKey);
    
    if (!result || result.startsWith("システムエラー") || result.startsWith("通信エラー")) {
      return interaction.editReply("データの取得に失敗しました。");
    }

    const data = JSON.parse(result) as { id: string, count: number }[];

    if (data.length === 0) {
      return interaction.editReply("このサーバーにはまだ「おもろい」の記録がありません。");
    }

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${interaction.guild?.name} おもろいりえランキング`)
      .setColor(0xFFAA00)
      .setTimestamp();

    const top10 = data.slice(0, 10);
    const listLines = await Promise.all(
      top10.map(async (item, index) => {
        try {
          const member = await interaction.guild?.members.fetch(item.id).catch(() => null);
          const name = member ? member.displayName : `不明なユーザー(${item.id})`;
          return `**${index + 1}位**: ${name} — ${item.count}回`;
        } catch {
          return `**${index + 1}位**: ${item.id} — ${item.count}回`;
        }
      })
    );

    embed.setDescription(listLines.join("\n"));

    return interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Rank command error:", error);
    return interaction.editReply("ランキングの読み込み中にエラーが発生しました。");
  }
}