import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo";
import { handleIconPrefix } from "../commands/icon";
import commandsJson from "../commands/commands.json" assert { type: "json" };

const commands = commandsJson as unknown as Record<string, string>;

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;

  const text = message.content;

  if (text.endsWith("おもろい")) return message.reply("りえ");
  if (text.endsWith("おもろ")) return message.reply("いりえ");

  if (text.startsWith("s.")) {
    const key = text.substring(2).trim();
    if (key in commands) return message.reply(String(commands[key]));
  }

  if (text.startsWith("s.memo")) return handleMemoPrefix(message);
  if (text.startsWith("s.icon")) return handleIconPrefix(message);
}