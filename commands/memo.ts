import { Message, ChatInputCommandInteraction } from "discord.js";
import { callGAS } from "../services/gasClient.js";

export async function handleMemoPrefix(message: Message) {
  const args = message.content.slice(2).trim().split(/\s+/); // "s.memo ..."
  const cmd = args.shift()?.toLowerCase();

  if (cmd !== "memo") return;

  if (args.length === 0) {
    return message.reply(
      "使い方:\n" +
      "・保存: s.memo key 内容\n" +
      "・取得: s.memo key\n" +
      "・削除: s.memo del key\n" +
      "・一覧: s.memo list"
    );
  }

  const first = args.shift()?.toLowerCase();

  // -------------------------------------------------
  // list: s.memo list
  // -------------------------------------------------
  if (first === "list") {
    const result = await callGAS("list", message.author.id, "");
    return message.reply(result);
  }

  // -------------------------------------------------
  // del: s.memo del key
  // -------------------------------------------------
  if (first === "del") {
    const delKey = args.shift();
    if (!delKey) return message.reply("削除する key を指定してください");
    const result = await callGAS("delete", message.author.id, delKey);
    return message.reply(result);
  }

  // -------------------------------------------------
  // save / get
  // -------------------------------------------------
  const key = first!;
  const content = args.join(" ");

  // 「del」「list」を key として使うのは禁止
  if (["del", "list"].includes(key)) {
    return message.reply(`「${key}」は key として使用できません`);
  }

  // 保存（s.memo key 内容）
  if (content.length > 0) {
    const result = await callGAS("save", message.author.id, key, content);
    return message.reply(result);
  }

  // 取得（s.memo key）
  const result = await callGAS("get", message.author.id, key);
  return message.reply(result);
}

// ----------------- Slash command definition & handler -----------------
export const memoSlashCommand = {
  name: "memo",
  description: "メモ関連コマンド",
  options: [
    {
      name: "save",
      type: 1, // subcommand
      description: "保存",
      options: [
        { name: "key", type: 3, description: "キー", required: true },
        { name: "content", type: 3, description: "内容", required: true }
      ]
    },
    {
      name: "get",
      type: 1,
      description: "取得",
      options: [
        { name: "key", type: 3, description: "キー", required: true }
      ]
    },
    {
      name: "del",
      type: 1,
      description: "削除",
      options: [
        { name: "key", type: 3, description: "キー", required: true }
      ]
    },
    {
      name: "list",
      type: 1,
      description: "一覧"
    }
  ]
};

export async function handleMemoSlash(interaction: ChatInputCommandInteraction) {
  try {
    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      const result = await callGAS("list", interaction.user.id, "");
      return interaction.reply(String(result));
    }

    if (sub === "del") {
      const key = interaction.options.getString("key", true);
      const result = await callGAS("delete", interaction.user.id, key);
      return interaction.reply(String(result));
    }

    if (sub === "get") {
      const key = interaction.options.getString("key", true);
      const result = await callGAS("get", interaction.user.id, key);
      return interaction.reply(String(result));
    }

    if (sub === "save") {
      const key = interaction.options.getString("key", true);
      const content = interaction.options.getString("content", true);
      const result = await callGAS("save", interaction.user.id, key, content);
      return interaction.reply(String(result));
    }

    return interaction.reply("Unknown subcommand");
  } catch (err) {
    console.error("handleMemoSlash error:", err);
    if (!interaction.replied) {
      return interaction.reply("エラーが発生しました");
    }
  }
}

