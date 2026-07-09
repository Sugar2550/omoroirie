import { ChatInputCommandInteraction, Message, GuildMember } from "discord.js";

export async function handleIconPrefix(message: Message) {
  const args = message.content.trim().split(/\s+/);
  const inputId = args[1];

  let avatarUrl = "";

  if (inputId) {
    const targetId = inputId.replace(/[^0-9]/g, "");
    
    try {
      if (message.guild) {
        const member = await message.guild.members.fetch(targetId).catch(() => null);
        if (member) {
          avatarUrl = member.displayAvatarURL({ size: 1024 });
        }
      }
      if (!avatarUrl) {
        const user = await message.client.users.fetch(targetId);
        avatarUrl = user.displayAvatarURL({ size: 1024 });
      }
    } catch (error) {
      return message.reply({
        content: "指定されたIDのユーザーが見つかりませんでした。",
        allowedMentions: { repliedUser: false }
      });
    }
  } else {
    avatarUrl = message.member?.displayAvatarURL({ size: 1024 }) || message.author.displayAvatarURL({ size: 1024 });
  }

  return message.reply({
    content: avatarUrl,
    allowedMentions: { repliedUser: false }
  });
}

export const iconSlashCommand = {
  name: "icon",
  description: "ユーザーのアイコンを取得",
  options: [
    {
      name: "user",
      type: 6, // USER
      description: "対象ユーザー",
      required: false
    }
  ]
};

export async function handleIconSlash(interaction: ChatInputCommandInteraction) {
  const member = interaction.options.getMember("user");
  const user = interaction.options.getUser("user") || interaction.user;

  let avatarUrl = "";
  if (member && member instanceof GuildMember) {
    avatarUrl = member.displayAvatarURL({ size: 1024 });
  } else {
    avatarUrl = user.displayAvatarURL({ size: 1024 });
  }

  return interaction.reply({
    content: avatarUrl,
    allowedMentions: { repliedUser: false }
  });
}
