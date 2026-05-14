import { REST, Routes } from 'discord.js';
import { memoSlashCommand } from './commands/memo.js';
import { iconSlashCommand } from './commands/icon.js';
import { rollSlashCommand } from './commands/roll.js';
import { rankSlashCommand } from './commands/rank.js';
import 'dotenv/config';

const commands = [
  memoSlashCommand,
  iconSlashCommand,
  rollSlashCommand,
  rankSlashCommand,
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log('スラッシュコマンドを登録中...');

    if (!process.env.CLIENT_ID) {
      throw new Error("CLIENT_ID が .env に設定されていません。");
    }

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('登録完了！Discordに反映されるまで数分〜最大1時間かかる場合があります。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
})();
