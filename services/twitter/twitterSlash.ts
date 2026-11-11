import {
  ChannelType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  MAX_PER_GUILD,
  addSubscription,
  listSubscriptions,
  removeSubscription,
} from "./twitterWatcher.js";

const USERNAME_RE = /^[A-Za-z0-9_]{1,15}$/;

// ===== コマンド定義(deploy-commands 側で登録に使う) =====
export const twitterSlashCommand = new SlashCommandBuilder()
  .setName("twitter")
  .setDescription("Twitter(X)の新規ツイート通知を設定します")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .setContexts(InteractionContextType.Guild)
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("監視を追加、または送信先を変更します")
      .addStringOption((o) =>
        o.setName("username").setDescription("ユーザー名(@なし)").setRequired(true).setMaxLength(16),
      )
      .addChannelOption((o) =>
        o
          .setName("channel")
          .setDescription("送信先チャンネル(省略で現在のチャンネル)")
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("del")
      .setDescription("監視を削除します")
      .addStringOption((o) =>
        o.setName("username").setDescription("ユーザー名(@なし)").setRequired(true).setMaxLength(16),
      ),
  )
  .addSubcommand((sub) => sub.setName("list").setDescription("設定の一覧を表示します"));

export const twitterSlashCommandJSON = twitterSlashCommand.toJSON();

// ===== ハンドラ =====
async function handleTwitterSlashInner(interaction: ChatInputCommandInteraction) {
  const guild = interaction.guild;
  if (!guild) {
    await interaction.reply({ content: "サーバー内でのみ使えます。", flags: MessageFlags.Ephemeral });
    return;
  }

  // 登録時の権限設定はサーバー側で変更されうるため、念のため再確認
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: "このコマンドには「サーバー管理」権限が必要です。",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "list") {
    const subs = await listSubscriptions(guild.id);
    await interaction.reply({
      content:
        subs.length === 0
          ? "設定はありません。`/twitter set` で追加できます。"
          : `**設定一覧** (${subs.length}/${MAX_PER_GUILD})\n` +
            subs.map((s) => `@${s.username} → <#${s.channelId}>`).join("\n"),
      allowedMentions: { parse: [] },
    });
    return;
  }

  const username = interaction.options.getString("username", true).replace(/^@/, "");
  if (!USERNAME_RE.test(username)) {
    await interaction.reply({
      content: "ユーザー名は英数字とアンダースコアのみ(15文字以内)で指定してください。",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (sub === "del") {
    const removed = await removeSubscription(guild.id, username);
    await interaction.reply({
      content: removed ? `@${username} の監視を削除しました。` : `@${username} は設定されていません。`,
    });
    return;
  }

  // set: RSS取得で時間がかかるため先に応答を保留する
  await interaction.deferReply();

  const picked = interaction.options.getChannel("channel");
  const channelId = picked?.id ?? interaction.channelId;
  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    await interaction.editReply("送信先チャンネルを正しく指定してください。");
    return;
  }

  const me = guild.members.me;
  if (me && !channel.permissionsFor(me)?.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) {
    await interaction.editReply("Botがそのチャンネルに送信できません。権限を確認してください。");
    return;
  }

  const result = await addSubscription({ guildId: guild.id, username, channelId: channel.id });
  await interaction.editReply(
    result.ok
      ? `@${username.toLowerCase()} の新規ツイートを <#${channel.id}> に送信します。` +
          (result.updated ? "(送信先を更新しました)" : "")
      : result.reason,
  );
}

export async function handleTwitterSlash(interaction: ChatInputCommandInteraction) {
  try {
    await handleTwitterSlashInner(interaction);
  } catch (e) {
    console.error("[twitter] スラッシュコマンド処理エラー:", e);
    const content = "エラーが発生しました。しばらくしてからもう一度お試しください。";
    if (interaction.deferred || interaction.replied) await interaction.editReply(content).catch(() => {});
    else await interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => {});
  }
}
