import { World } from '../../core/world.js';
import { CommandHandler } from '../commandHandler.js';
import { AsyncRequestEvent } from './worldSession.js';
import { System } from '../../core/events/eventTypes.js';

export class AsyncCommandHandler {
    private world: World;
    private baseHandler: CommandHandler;

    constructor(world: World, baseHandler: CommandHandler) {
        this.world = world;
        this.baseHandler = baseHandler;
    }

    registerHandlers() {
        this.world.eventBus.subscribe(System.AsyncRequest, async (event: any) => {
            const req = event as AsyncRequestEvent;
            const { action, params, resolve, reject } = req.payload;

            console.log(`[AsyncCommandHandler] Processing request: ${action}`, params);

            try {
                let result;
                switch (action) {
                    case 'command':
                        if (typeof params?.cmdStr === 'string') {
                            const cmd = params.cmdStr.trim().toLowerCase();
                            if (cmd.startsWith('advance_tick') || cmd.startsWith('warp_evolution')) {
                                result = { success: false, message: `Use /api/tick instead of '${params.cmdStr}'.` };
                                break;
                            }
                        }
                        result = await this.baseHandler.execute(params.cmdStr);
                        break;
                    case 'status':
                        result = await this.baseHandler.execute(`status ${params.id || ''}`);
                        break;
                    default:
                        result = { success: false, message: `Unknown action: ${action}` };
                }
                resolve(result);
            } catch (error) {
                console.error(`[AsyncCommandHandler] Error processing ${action}:`, error);
                reject(error);
            }
        });
    }
}
