import { ChatInputCommandInteraction, Message, GuildMember } from "discord.js";

export async function handleIconPrefix(message: Message) {
  if (!message.content.startsWith("s.icon")) return;

  const member = message.mentions.members?.first() || message.member;
  if (!member) return;

  return message.reply(member.displayAvatarURL());
}

export const iconSlashCommand = {
  name: "icon",
  description: "ユーザーのアイコンを取得",
  options: [
    {
      name: "user",
      type: 6,
      description: "対象ユーザー",
      required: false
    }
  ]
};

export async function handleIconSlash(interaction: ChatInputCommandInteraction) {
  const user = interaction.options.getUser("user") || interaction.user;
  return interaction.reply(user.displayAvatarURL());
}
