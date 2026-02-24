import { Request, Response } from 'express';
import { WorldSession } from '../worldSession.js';

interface ScenarioStep {
    cmd: string;
    description?: string;
}

interface Scenario {
    id: string;
    name: string;
    description: string;
    steps: ScenarioStep[];
}

const SCENARIO_REGISTRY: Record<string, Scenario> = {
    'quick-start': {
        id: 'quick-start',
        name: 'Quick Start',
        description: 'Resets the world and spawns basic life forms.',
        steps: [
            // { cmd: 'reset_world', description: 'Resetting world state...' }, // reset_world is dangerous/not fully implemented, skipping for now
            { cmd: 'spawn_entity plant Rose', description: 'Spawning initial plant...' },
            { cmd: 'spawn_entity ga Wolf', description: 'Spawning initial creature...' },
            { cmd: 'advance_tick 10', description: 'Advancing 10 ticks...' }
        ]
    },
    'mass-extinction': {
        id: 'mass-extinction',
        name: 'Mass Extinction Event',
        description: 'Triggers a meteor impact and observes the aftermath.',
        steps: [
            { cmd: 'meteor 50 50', description: 'Meteor impact at center...' },
            { cmd: 'advance_tick 20', description: 'Simulating immediate aftermath...' }
        ]
    }
};

export const handleGetScenarios = () => async (req: Request, res: Response) => {
    const list = Object.values(SCENARIO_REGISTRY).map(({ id, name, description }) => ({ id, name, description }));
    res.json({ success: true, scenarios: list });
};

export const handlePostScenario = (session: WorldSession) => async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const scenario = SCENARIO_REGISTRY[id];

    if (!scenario) {
        res.status(404).json({ success: false, message: `Scenario '${id}' not found.` });
        return;
    }

    const results: any[] = [];
    try {
        for (const step of scenario.steps) {
            const cmdParts = step.cmd.trim().split(/\s+/);
            const cmdName = cmdParts[0].toLowerCase();
            
            let result;
            if (cmdName === 'advance_tick' || cmdName === 'warp_evolution') {
                const count = parseInt(cmdParts[1] || '1', 10);
                result = await session.tickNow(count);
            } else {
                result = await session.enqueueRequest('command', { cmdStr: step.cmd });
            }
            
            results.push({ cmd: step.cmd, success: result.success, message: result.message });
            
            if (!result.success) {
                // Stop on failure? or Continue? Let's stop.
                throw new Error(`Step '${step.cmd}' failed: ${result.message}`);
            }
        }
        res.json({ success: true, message: `Scenario '${id}' completed.`, steps: results });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message, partialResults: results });
    }
};
