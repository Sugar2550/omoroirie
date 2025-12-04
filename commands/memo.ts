import { ChatInputCommandInteraction, Message } from "discord.js";
import { callGAS } from "../services/gasClient.js";

const INVALID_KEYS = ["del", "list"];

export async function handleMemoPrefix(message: Message) {
  const args = message.content.slice(2).trim().split(/\s+/); // "s.memo ..."
  const cmd = args.shift()?.toLowerCase();

  if (cmd !== "memo") return;

  if (args.length === 0) {
    return message.reply("使い方: s.memo key [内容]");
  }

  const key = args.shift()!;
  const content = args.join(" ");

  if (INVALID_KEYS.includes(key)) {
    return message.reply(`「${key}」は key として使用できません`);
  }

  // s.memo del key
  if (key === "del") {
    const delKey = args[0];
    if (!delKey) return message.reply("削除する key を指定してください");

    const result = await callGAS("delete", message.author.id, delKey);
    return message.reply(result);
  }

  // s.memo list
  if (key === "list") {
    const result = await callGAS("list", message.author.id, "");
    return message.reply(result);
  }

  // s.memo key 内容 → 保存
  if (content.length > 0) {
    const result = await callGAS("save", message.author.id, key, content);
    return message.reply(result);
  }

  // s.memo key → 取得
  const result = await callGAS("get", message.author.id, key);
  return message.reply(result);
}

// slash command
export const memoSlashCommand = {
  name: "memo",
  description: "メモの保存・取得・削除・一覧",
  options: [
    {
      name: "mode",
      type: 3,
      description: "save / get / delete / list",
      required: true,
      choices: [
        { name: "save", value: "save" },
        { name: "get", value: "get" },
        { name: "delete", value: "delete" },
        { name: "list", value: "list" }
      ]
    },
    {
      name: "key",
      type: 3,
      description: "キー（delete・list は不要）",
      required: false
    },
    {
      name: "content",
      type: 3,
      description: "保存する内容（save のみ）",
      required: false
    }
  ]
};

export async function handleMemoSlash(interaction: ChatInputCommandInteraction) {
  const mode = interaction.options.getString("mode", true);
  const key = interaction.options.getString("key") || "";
  const content = interaction.options.getString("content") || "";

  if (INVALID_KEYS.includes(key)) {
    return interaction.reply(`「${key}」は key として使用できません`);
  }

  const userId = interaction.user.id;

  if (mode === "list") {
    return interaction.reply(await callGAS("list", userId, ""));
  }
  if (mode === "delete") {
    return interaction.reply(await callGAS("delete", userId, key));
  }
  if (mode === "get") {
    return interaction.reply(await callGAS("get", userId, key));
  }
  if (mode === "save") {
    return interaction.reply(await callGAS("save", userId, key, content));
  }

  return interaction.reply("不明な操作です");
}
