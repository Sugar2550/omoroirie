import { Message } from "discord.js";
import { handleMemoPrefix } from "../commands/memo.js";
import { handleIconPrefix } from "../commands/icon.js";
import { callGAS } from "../services/gasClient.js";
import commandsJson from "../commands/commands.json" with { type: "json" };

const commands = commandsJson as Record<string, string>;

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;

  const text = message.content;

  if (text === "s.roll") {
    const seed = await callGAS("get", message.author.id, "rseed");

    if (!message.channel) return;
    if (!message.channel.isTextBased()) return;
    if (!("send" in message.channel)) return;

    const channel = message.channel;

    if (!seed || seed === "NOT_FOUND") {
      return channel.send({
        content: "rseed が設定されていません。`s.memo rseed 数値` で設定してください。",
        allowedMentions: { repliedUser: false }
      });
    }

    return channel.send({
      content: `https://bc.godfat.org/?seed=${seed}&lang=jp`,
      allowedMentions: { repliedUser: false }
    });
  }


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

