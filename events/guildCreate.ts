import { Guild } from "discord.js";
import "dotenv/config";

export async function onGuildCreate(guild: Guild) {
  const ownerId = process.env.OWNER_ID;
  if (!ownerId) return;

  try {
    const owner = await guild.client.users.fetch(ownerId);
    await owner.send(`🎉 **新しいサーバーに追加されました！**\nサーバー名: \`${guild.name}\`\nサーバーID: \`${guild.id}\``);
  } catch (error) {
    console.error("オーナーへのDM送信に失敗しました:", error);
  }
}