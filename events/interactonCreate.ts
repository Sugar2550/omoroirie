import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo.js";
import { handleIconPrefix } from "../commands/icon.js";

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;

  const text = message.content;

  // 語尾変換
  if (text.endsWith("おもろい")) {
    return message.reply("りえ");
  }
  if (text.endsWith("おもろ")) {
    return message.reply("いりえ");
  }

  // prefix command（s.memo / s.icon）
  if (text.startsWith("s.memo")) return handleMemoPrefix(message);
  if (text.startsWith("s.icon")) return handleIconPrefix(message);
}
