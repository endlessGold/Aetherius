import * as readline from 'readline';
export class CLI {
    constructor(handler) {
        this.handler = handler;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'Divine Will> '
        });
    }
    start() {
        const messages = [
            "Welcome, Almighty One.",
            "The world awaits your command.",
            "Type 'help' to see your powers."
        ];
        console.log(`\n${messages.join('\n')}\n`);
        this.rl.prompt();
        this.rl.on('line', async (line) => {
            const input = line.trim();
            if (input) {
                if (input === 'exit' || input === 'quit') {
                    console.log('Farewell, Creator. The world shall pause until your return.');
                    this.rl.close();
                    process.exit(0);
                }
                const result = await this.handler.execute(input);
                if (result.success) {
                    console.log(`✨ [DIVINE DECREE] ${result.message}`);
                    if (result.data) {
                        console.log(JSON.stringify(result.data, null, 2));
                    }
                }
                else {
                    console.error(`🌑 [PRAYER UNANSWERED] ${result.message}`);
                }
            }
            this.rl.prompt();
        }).on('close', () => {
            console.log('The simulation fades into the void.');
            process.exit(0);
        });
    }
}
