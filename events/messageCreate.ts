import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo.js";
import { handleIconPrefix } from "../commands/icon.js";
import commandsJson from "../commands/commands.json" with { type: "json" };

const commands = commandsJson as Record<string, string>;

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;

  const text = message.content;

  if (text.endsWith("おもろい")) {
    return message.reply({
      content: "りえ",
      allowedMentions: { repliedUser: false }
    });
  }

  if (text.endsWith("おもろ")) {
    return message.reply({
      content: "いりえ",
      allowedMentions: { repliedUser: false }
    });
  }

  if (text.startsWith("s.")) {
    const key = text.substring(2).trim();
    if (key in commands) {
      return message.reply({
        content: String(commands[key]),
        allowedMentions: { repliedUser: false }
      });
    }
  }

  if (text.startsWith("s.memo")) return handleMemoPrefix(message);
  if (text.startsWith("s.icon")) return handleIconPrefix(message);
}

