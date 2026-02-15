// 기존 CommandHandler는 동기적이지만, 비동기 처리를 위해 래핑
// World의 EventLoop에 등록되어 비동기 이벤트를 실제 로직으로 연결
export class AsyncCommandHandler {
    constructor(world, baseHandler) {
        this.world = world;
        this.baseHandler = baseHandler;
    }
    // World의 EventLoop에 핸들러 등록
    registerHandlers() {
        this.world.eventLoop.register('AsyncRequest', async (event) => {
            const req = event;
            const { action, params, resolve, reject } = req.payload;
            console.log(`[AsyncCommandHandler] Processing request: ${action}`, params);
            try {
                let result;
                switch (action) {
                    case 'command':
                        // params.cmdStr 예: "spawn_entity plant Rose"
                        result = await this.baseHandler.execute(params.cmdStr);
                        break;
                    case 'status':
                        result = await this.baseHandler.execute(`status ${params.id || ''}`);
                        break;
                    case 'tick':
                        // Tick은 루프에서 자동 처리되지만, 수동 Tick 요청도 가능
                        result = await this.baseHandler.execute(`advance_tick ${params.count || 1}`);
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
