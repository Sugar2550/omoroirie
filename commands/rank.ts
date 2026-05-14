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
      return interaction.editReply("このサーバーにはまだ「おもろいりえ」の記録がありません。");
    }

    const totalCount = data.reduce((sum, item) => sum + item.count, 0);
    const totalUsers = data.length;

    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${interaction.guild?.name} おもろいりえランキング`)
      .setColor(0xFFAA00)
      .setTimestamp();

    const top5 = data.slice(0, 5);
    const listLines = await Promise.all(
      top5.map(async (item, index) => {
        let rankEmoji = "🎖️";
        if (index === 0) rankEmoji = "🥇";
        else if (index === 1) rankEmoji = "🥈";
        else if (index === 2) rankEmoji = "🥉";

        let name = `不明なユーザー(${item.id})`;
        try {
          const member = await interaction.guild?.members.fetch(item.id).catch(() => null);
          if (member) {
            name = member.displayName;
          }
        } catch {
        }

        return `${rankEmoji}第${index + 1}位: ${item.count}回\n${name}`;
      })
    );

    const description = `累計 ${totalCount} 回 / ${totalUsers} 人\n\n${listLines.join("\n")}`;
    embed.setDescription(description);

    return interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Rank command error:", error);
    return interaction.editReply("ランキングの読み込み中にエラーが発生しました。");
  }
}