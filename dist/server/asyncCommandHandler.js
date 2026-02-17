import { System } from '../core/events/eventTypes.js';
// 기존 CommandHandler는 동기적이지만, 비동기 처리를 위해 래핑
// World의 EventLoop에 등록되어 비동기 이벤트를 실제 로직으로 연결
export class AsyncCommandHandler {
    constructor(world, baseHandler) {
        this.world = world;
        this.baseHandler = baseHandler;
    }
    // World의 EventLoop에 핸들러 등록
    registerHandlers() {
        this.world.eventLoop.register(System.AsyncRequest, async (event) => {
            const req = event;
            const { action, params, resolve, reject } = req.payload;
            console.log(`[AsyncCommandHandler] Processing request: ${action}`, params);
            try {
                let result;
                switch (action) {
                    case 'command':
                        // params.cmdStr 예: "spawn_entity plant Rose"
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
            }
            catch (error) {
                console.error(`[AsyncCommandHandler] Error processing ${action}:`, error);
                reject(error);
            }
        });
    }
}
