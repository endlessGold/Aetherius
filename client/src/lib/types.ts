export interface Choice {
    text: string;
    action: () => void;
    disabled?: boolean;
}

export interface Scene {
    id: string;
    title: string;
    description: string;
    image?: string;
    choices: Choice[];
}

export interface NodeConnection {
    targetNodeId: string;
    label: string; // e.g. "서쪽 골목", "광장으로"
    condition?: string; // e.g. "has_item:old_key"
    cost?: number; // time cost in minutes
    isLocked?: boolean;
    lockedMessage?: string;
}

export interface GameNode {
    id: string;
    name: string;
    description: string;
    type: 'safe' | 'danger' | 'neutral';
    connections: NodeConnection[];
    image?: string; // Background artwork
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    objectives: { text: string; completed: boolean }[];
}

export interface PartyMember {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    location: string; // Node ID
    status: 'online' | 'offline' | 'busy';
}

export interface GameState {
    hp: number;
    maxHp: number;
    mp: number; // Added
    maxMp: number; // Added
    mental: number;
    maxMental: number;
    level: number; // Added
    exp: number; // Added
    maxExp: number; // Added
    gold: number; // Added
    cash: number; // Added (Paid currency)
    points: number; // Added (Special points)
    sap: number;
    time: string;
    location: string;
    log: string[];
    status: 'title' | 'playing' | 'gameover';
    quests: Quest[]; // Added
    party: PartyMember[]; // Added
    isMoving?: boolean;
}
