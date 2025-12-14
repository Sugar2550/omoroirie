import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo";
import { handleIconPrefix } from "../commands/icon";
import commandsJson from "../commands/commands.json" assert { type: "json" };

// 型安全のため、JSON を Record<string,string> として扱う
const commands = commandsJson as unknown as Record<string, string>;

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

  // ---- 追加：JSON の簡易コマンド ----
  // s.xxx の形式を解析
  if (text.startsWith("s.")) {
    const key = text.substring(2).trim();  // "s.ping" → "ping"

    if (key in commands) {
      return message.reply(String(commands[key]));
    }
  }
  // ----------------------------------

  // prefix command（s.memo / s.icon）
  if (text.startsWith("s.memo")) return handleMemoPrefix(message);
  if (text.startsWith("s.icon")) return handleIconPrefix(message);
}
