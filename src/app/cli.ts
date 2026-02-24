import * as readline from 'readline';
import { CommandHandler } from './commandHandler.js';

export class CLI {
  private handler: CommandHandler;
  private rl: readline.Interface;

  constructor(handler: CommandHandler) {
    this.handler = handler;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'Divine Will> '
    });
  }

  public start() {
    const lang = (process.env.AETHERIUS_OUTPUT_LANG ?? '').toLowerCase();
    const isKorean = lang === 'ko';
    const messages = isKorean
      ? [
          '어서 오십시오, 전지전능하신 분.',
          '이 세계는 당신의 명령을 기다리고 있습니다.',
          "명령 목록을 보려면 'help' 를 입력하세요."
        ]
      : [
          'Welcome, Almighty One.',
          'The world awaits your command.',
          "Type 'help' to see your powers."
        ];
    const successPrefix = isKorean ? '✨ [신의 명령 집행됨]' : '✨ [DIVINE DECREE]';
    const errorPrefix = isKorean ? '🌑 [기도가 응답되지 않음]' : '🌑 [PRAYER UNANSWERED]';
    console.log(`\n${messages.join('\n')}\n`);
    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (input) {
        if (input === 'exit' || input === 'quit') {
          console.log(
            isKorean
              ? '안녕히 가십시오. 당신이 돌아올 때까지 세계는 멈춰 있을 것입니다.'
              : 'Farewell, Creator. The world shall pause until your return.'
          );
          this.rl.close();
          process.exit(0);
        }

        const result = await this.handler.execute(input);
        if (result.success) {
          console.log(`${successPrefix} ${result.message}`);
          if (result.data) {
            console.log(JSON.stringify(result.data, null, 2));
          }
        } else {
          console.error(`${errorPrefix} ${result.message}`);
        }
      }
      this.rl.prompt();
    }).on('close', () => {
      console.log(
        isKorean ? '시뮬레이션이 서서히 암흑 속으로 사라집니다.' : 'The simulation fades into the void.'
      );
      process.exit(0);
    });
  }
}
