import * as readline from 'readline';
export class CLI {
    constructor(handler) {
        this.handler = handler;
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'Aetherius> '
        });
    }
    start() {
        console.log("Welcome to Aetherius CLI. Type 'help' for commands.");
        this.rl.prompt();
        this.rl.on('line', async (line) => {
            const input = line.trim();
            if (input) {
                if (input === 'exit' || input === 'quit') {
                    this.rl.close();
                    process.exit(0);
                }
                const result = await this.handler.execute(input);
                if (result.success) {
                    console.log(`✅ ${result.message}`);
                    if (result.data) {
                        console.log(JSON.stringify(result.data, null, 2));
                    }
                }
                else {
                    console.error(`❌ ${result.message}`);
                }
            }
            this.rl.prompt();
        }).on('close', () => {
            console.log('Exiting CLI.');
            process.exit(0);
        });
    }
}
