import { Message, ChatInputCommandInteraction } from "discord.js";
import { callGAS } from "../services/gasClient.js";

export async function handleMemoPrefix(message: Message) {
  const raw = message.content.slice(2);
  if (!raw.startsWith("memo")) return;

  if (!message.channel) return;
  if (!message.channel.isTextBased()) return;
  if (!("send" in message.channel)) return;

  const channel = message.channel;

  const afterMemo = raw.slice(4).replace(/^\s+/, "");
  if (!afterMemo) {
    return channel.send(
      "使い方:\n" +
      "・保存: s.memo key 内容\n" +
      "・取得: s.memo key\n" +
      "・削除: s.memo del key\n" +
      "・一覧: s.memo list"
    );
  }

  const lines = afterMemo.split(/\r?\n/);
  const firstLine = lines.shift()!;
  const restText = lines.join("\n");

  const [first, ...inlineRest] = firstLine.split(/\s+/);
  const rest =
    inlineRest.length > 0
      ? inlineRest.join(" ") + (restText ? "\n" + restText : "")
      : restText;

  // list
  if (first === "list") {
    const result = await callGAS("list", message.author.id, "");
    return channel.send(String(result));
  }

  // del
  if (first === "del") {
    if (!rest.trim()) {
      return channel.send("削除する key を指定してください");
    }
    const result = await callGAS("delete", message.author.id, rest.trim());
    return channel.send(String(result));
  }

  const key = first;

  if (["del", "list"].includes(key)) {
    return channel.send(`「${key}」は key として使用できません`);
  }

  // save
  if (rest.length > 0) {
    const result = await callGAS("save", message.author.id, key, rest);
    return channel.send(String(result));
  }

  // get
  const result = await callGAS("get", message.author.id, key);
  return channel.send(String(result));
}

// ----------------- Slash command -----------------

export const memoSlashCommand = {
  name: "memo",
  description: "メモ関連コマンド",
  options: [
    {
      name: "save",
      type: 1,
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
