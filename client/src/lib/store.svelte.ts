import { type GameState, type Scene, type GameNode } from './types';

// Mock Data for Nodes
const nodes: Record<string, GameNode> = {
    'central_plaza': {
        id: 'central_plaza',
        name: 'CENTRAL HUB',
        description: 'Sector 7 Central Command. All systems operational.',
        type: 'neutral',
        connections: [
            { targetNodeId: 'outpost_alpha', label: 'OUTPOST ALPHA', cost: 10 },
            { targetNodeId: 'mining_site', label: 'MINING SITE', cost: 15 },
            { targetNodeId: 'defense_outpost', label: 'DEFENSE OUTPOST', cost: 5, isLocked: true, lockedMessage: 'Security Clearance Required.' },
            { targetNodeId: 'research_facility', label: 'RESEARCH FACILITY', cost: 20 },
            { targetNodeId: 'trading_hub', label: 'TRADING HUB', cost: 10 },
            { targetNodeId: 'abandoned_base', label: 'ABANDONED BASE', cost: 30 }
        ]
    },
    'outpost_alpha': {
        id: 'outpost_alpha',
        name: 'OUTPOST ALPHA',
        description: 'Forward operating base. Perimeter secure.',
        type: 'safe',
        connections: [
            { targetNodeId: 'central_plaza', label: 'RETURN TO HUB', cost: 10 }
        ]
    },
    'mining_site': {
        id: 'mining_site',
        name: 'MINING SITE',
        description: 'Automated extraction zone. Heavy machinery active.',
        type: 'neutral',
        connections: [
            { targetNodeId: 'central_plaza', label: 'RETURN TO HUB', cost: 15 }
        ]
    },
    'defense_outpost': {
        id: 'defense_outpost',
        name: 'DEFENSE OUTPOST',
        description: 'Restricted military zone.',
        type: 'danger',
        connections: [
            { targetNodeId: 'central_plaza', label: 'RETURN TO HUB', cost: 5 }
        ]
    },
    'research_facility': {
        id: 'research_facility',
        name: 'RESEARCH FACILITY',
        description: 'Advanced labs. Unauthorized access prohibited.',
        type: 'neutral',
        connections: [
            { targetNodeId: 'central_plaza', label: 'RETURN TO HUB', cost: 20 }
        ]
    },
    'trading_hub': {
        id: 'trading_hub',
        name: 'TRADING HUB',
        description: 'Commercial sector. Market activity high.',
        type: 'safe',
        connections: [
            { targetNodeId: 'central_plaza', label: 'RETURN TO HUB', cost: 10 }
        ]
    },
    'abandoned_base': {
        id: 'abandoned_base',
        name: 'ABANDONED BASE',
        description: 'Derelict structure. Life support offline.',
        type: 'danger',
        connections: [
            { targetNodeId: 'central_plaza', label: 'RETURN TO HUB', cost: 30 }
        ]
    }
};

// Svelte 5 Runes for state management
let _gameState = $state<GameState>({
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    mental: 100,
    maxMental: 100,
    level: 1,
    exp: 0,
    maxExp: 100,
    gold: 500,
    cash: 0,
    points: 0,
    sap: 0,
    time: 'Day 1 - 09:00',
    location: '중앙 광장',
    log: ['시스템 부팅 완료...', '생체 신호 정상.'],
    status: 'title',
    quests: [
        { id: 'q1', title: '생존의 시작', description: '주변을 둘러보고 상황을 파악하라.', status: 'active', objectives: [{ text: '주변 조사', completed: false }] }
    ],
    party: [
        { id: 'p1', name: '알렌', hp: 80, maxHp: 100, location: 'central_plaza', status: 'online' }
    ],
    isMoving: false
});

let _currentNode = $state<GameNode>(nodes['central_plaza']);

let _currentScene = $state<Scene>({
    id: 'start',
    title: '차가운 바닥',
    description: '눈을 떴다. 머리가 지끈거린다. 주변은 어둡고 습하다. 어딘지 모르겠지만, 살아있는 것 같다.',
    choices: [
        { text: '주위를 둘러본다', action: () => nextScene('look_around') },
        { text: '일어난다', action: () => nextScene('stand_up') }
    ]
});

export const gameState = {
    get hp() { return _gameState.hp },
    get maxHp() { return _gameState.maxHp },
    get mp() { return _gameState.mp },
    get maxMp() { return _gameState.maxMp },
    get mental() { return _gameState.mental },
    get maxMental() { return _gameState.maxMental },
    get level() { return _gameState.level },
    get exp() { return _gameState.exp },
    get maxExp() { return _gameState.maxExp },
    get gold() { return _gameState.gold },
    get cash() { return _gameState.cash },
    get points() { return _gameState.points },
    get sap() { return _gameState.sap },
    get time() { return _gameState.time },
    get location() { return _gameState.location },
    get log() { return _gameState.log },
    get status() { return _gameState.status },
    get quests() { return _gameState.quests },
    get party() { return _gameState.party },
    get isMoving() { return _gameState.isMoving }, // Added

    // Setters for read-only properties
    set mental(value: number) { _gameState.mental = value; },
    set mp(value: number) { _gameState.mp = value; },
    set exp(value: number) { _gameState.exp = value; },
    set gold(value: number) { _gameState.gold = value; },
    set points(value: number) { _gameState.points = value; },
    set sap(value: number) { _gameState.sap = value; },

    modifyMental(amount: number) {
        _gameState.mental = Math.max(0, Math.min(_gameState.maxMental, _gameState.mental + amount));
    },

    setStatus(status: 'title' | 'playing' | 'gameover') {
        _gameState.status = status;
    },

    addLog(message: string) {
        _gameState.log.push(message);
        if (_gameState.log.length > 50) _gameState.log.shift();
    },

    modifyHp(amount: number) {
        _gameState.hp = Math.max(0, Math.min(_gameState.maxHp, _gameState.hp + amount));
    },

    moveTime(minutes: number) {
        // Simple time string update logic for demo
        // In real app, use Date object or integer minutes
        _gameState.time = `Day 1 - ${Math.floor(Math.random() * 12 + 1)}:00`;
    }
};

export const currentNode = {
    get id() { return _currentNode.id },
    get name() { return _currentNode.name },
    get description() { return _currentNode.description },
    get type() { return _currentNode.type },
    get connections() { return _currentNode.connections },
    get image() { return _currentNode.image },

    async moveTo(targetId: string) {
        const target = nodes[targetId];
        if (target && !_gameState.isMoving) {
            const connection = _currentNode.connections.find(c => c.targetNodeId === targetId);
            const cost = connection?.cost || 0;

            _gameState.isMoving = true;
            gameState.addLog(`이동 중... (${cost}분 소요 예상)`);

            // Simulate travel time (1 second per 10 minutes game time, max 3 seconds)
            const delay = Math.min(3000, Math.max(500, cost * 100));

            await new Promise(resolve => setTimeout(resolve, delay));

            _gameState.isMoving = false;
            _currentNode = target;
            _gameState.location = target.name;
            gameState.moveTime(cost);
            gameState.addLog(`${target.name}(으)로 이동했습니다.`);

            // Sync Scene Description (Optional, if we want scene to reflect node)
            _currentScene.title = target.name;
            _currentScene.description = target.description;
            _currentScene.choices = []; // Clear old choices or add generic ones
        }
    }
};

export const currentScene = {
    get title() { return _currentScene.title },
    get description() { return _currentScene.description },
    get choices() { return _currentScene.choices },

    setScene(scene: Scene) {
        _currentScene.title = scene.title;
        _currentScene.description = scene.description;
        _currentScene.choices = scene.choices;
        _currentScene.id = scene.id;
    }
};

// 간단한 시나리오 로직 (나중에 별도 파일로 분리)
function nextScene(actionId: string) {
    if (actionId === 'look_around') {
        gameState.addLog('주위를 둘러보았다.');
        currentScene.setScene({
            id: 'corridor',
            title: '녹슨 복도',
            description: '벽면을 타고 녹색 이끼가 자라나고 있다. 저 멀리서 기계음이 들린다.',
            choices: [
                { text: '소리가 나는 쪽으로 간다', action: () => nextScene('noise') },
                { text: '반대편으로 도망친다', action: () => nextScene('run') }
            ]
        });
    } else if (actionId === 'stand_up') {
        gameState.addLog('일어났다.');
        gameState.modifyHp(-5);
        gameState.addLog('다리에 힘이 풀려 비틀거렸다. (HP -5)');
        // 다시 원래 선택지로 돌아가거나 변경 없음
    } else if (actionId === 'noise') {
        gameState.addLog('용기를 내어 소리가 나는 곳으로 향했다.');
        currentScene.setScene({
            id: 'encounter_rat',
            title: '조우: 태엽 쥐',
            description: '작은 쥐 한 마리가 녹슨 태엽을 감으며 당신을 쳐다본다. 눈에서 붉은 빛이 난다.',
            choices: [
                { text: '손을 내밀어본다 (테이밍 시도)', action: () => nextScene('tame_rat') },
                { text: '발로 찬다', action: () => nextScene('kick_rat') }
            ]
        });
    } else if (actionId === 'tame_rat') {
        gameState.addLog('쥐에게 손을 내밀었다...');
        gameState.addLog('쥐가 당신의 손가락을 깨물었다! (테이밍 실패)');
        gameState.modifyHp(-10);
        currentScene.setScene({
            id: 'rat_attack',
            title: '도망친 쥐',
            description: '쥐는 어둠 속으로 사라졌다. 손가락에서 피가 흐른다.',
            choices: [
                { text: '상처를 감싼다', action: () => nextScene('start') } // 루프
            ]
        });
    } else {
        gameState.addLog('아직 구현되지 않은 분기입니다.');
    }
}
