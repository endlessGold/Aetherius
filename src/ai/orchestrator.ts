import { ControlService, createControlService } from './llmService.js';
import { ScientistAgent, NetworkScienceAgent, EcologyAgent, EvolutionAgent, ClimateHydrologyAgent, LifeScienceAgent, GeologistAgent, AgentResponse } from './agents/scientistAgents.js';
import type { Persistence } from '../data/persistence.js';

export interface ScienceReport {
    query: string;
    projectContext: string;
    modelName?: string;
    hypotheses: AgentResponse[];
    reviews: { reviewer: string; target: string; critique: string }[];
    rebuttals: { agent: string; content: string }[];
    synthesis: string;
    /** Parsed from synthesis "### Recommended Actions" block; one command per line */
    recommendedActions?: string[];
}

/** 실험 단계별 DB 기록용 페이로드 (이벤트 발생 시 저장) */
export type ExperimentEventPayload =
    | { kind: 'science_hypothesis'; agent: string; name: string; query: string; content: string }
    | { kind: 'science_review'; reviewer: string; target: string; query: string; critique: string }
    | { kind: 'science_rebuttal'; agent: string; query: string; content: string }
    | { kind: 'science_synthesis'; query: string; synthesis: string; recommendedActions?: string[] };

export interface ScienceOrchestratorOptions {
    recordExperimentEvent?: (payload: ExperimentEventPayload) => Promise<void>;
    persistence?: Persistence;
    getWorldContext?: () => { worldId: string; tick: number };
    mode?: 'full' | 'lite';
    maxAgents?: number;
    enablePeerReview?: boolean;
    enableRebuttal?: boolean;
}

export class ScienceOrchestrator {
    private agents: ScientistAgent[];
    private control: ControlService;
    private recordExperimentEvent?: (payload: ExperimentEventPayload) => Promise<void>;
    private mode: 'full' | 'lite';
    private enablePeerReview: boolean;
    private enableRebuttal: boolean;

    constructor(options?: ScienceOrchestratorOptions) {
        this.control = createControlService();
        this.recordExperimentEvent = options?.recordExperimentEvent;
        if (!this.recordExperimentEvent && options?.persistence && options?.getWorldContext) {
            const persistence = options.persistence;
            const getWorldContext = options.getWorldContext;
            this.recordExperimentEvent = async (payload) => {
                const { worldId, tick } = getWorldContext();
                await persistence.saveWorldEvent({
                    worldId,
                    tick,
                    type: 'OTHER',
                    location: { x: 0, y: 0 },
                    details: JSON.stringify(payload)
                });
            };
        }
        const envMode = (process.env.AETHERIUS_SCIENCE_MODE || '').toLowerCase();
        const mode = options?.mode ?? (envMode === 'lite' ? 'lite' : 'full');
        this.mode = mode;
        this.enablePeerReview = options?.enablePeerReview ?? (mode === 'full');
        this.enableRebuttal = options?.enableRebuttal ?? (mode === 'full');
        const baseAgents: ScientistAgent[] = [
            new NetworkScienceAgent(this.control),
            new EcologyAgent(this.control),
            new EvolutionAgent(this.control),
            new ClimateHydrologyAgent(this.control),
            new LifeScienceAgent(this.control),
            new GeologistAgent(this.control)
        ];
        const maxAgents = options?.maxAgents && options.maxAgents > 0 ? options.maxAgents : baseAgents.length;
        this.agents = baseAgents.slice(0, maxAgents);
    }

    async processQuery(query: string, projectContext: string): Promise<ScienceReport> {
        const modelName = this.control.getModelName();
        console.log(`\n🧪 [Science] Orchestrating query: "${query}" (Model: ${modelName})`);

        const hypotheses: AgentResponse[] = [];
        console.log(`\n--- Phase 1: Individual Analysis ---`);
        const phase1Concurrency = 2;
        const tasks: Promise<void>[] = [];

        for (const agent of this.agents) {
            const task = (async () => {
                console.log(`... ${agent.name} (${agent.domain}) is thinking...`);
                const content = await agent.analyze(query, projectContext);
                hypotheses.push({ agent: agent.domain, content });
                await this.recordExperimentEvent?.({
                    kind: 'science_hypothesis',
                    agent: agent.domain,
                    name: agent.name,
                    query,
                    content
                });
                console.log(`✅ ${agent.name}: Hypothesis generated.`);
            })();
            tasks.push(task);
            if (tasks.length >= phase1Concurrency) {
                await Promise.all(tasks);
                tasks.length = 0;
            }
        }
        if (tasks.length > 0) await Promise.all(tasks);

        console.log(`\n--- Phase 2: Peer Review ---`);
        const reviews: { reviewer: string; target: string; critique: string }[] = [];
        if (this.enablePeerReview) {
            for (const agent of this.agents) {
                const others = hypotheses.filter(h => h.agent !== agent.domain);
                for (const peerHypothesis of others) {
                    console.log(`... ${agent.name} is reviewing ${peerHypothesis.agent}'s hypothesis...`);
                    const critique = await agent.review(peerHypothesis, query, projectContext);
                    reviews.push({ reviewer: agent.domain, target: peerHypothesis.agent, critique });
                    await this.recordExperimentEvent?.({
                        kind: 'science_review',
                        reviewer: agent.domain,
                        target: peerHypothesis.agent,
                        query,
                        critique
                    });
                }
            }
        }

        console.log(`\n--- Phase 2.5: Rebuttal ---`);
        const rebuttals: { agent: string; content: string }[] = [];
        if (this.enableRebuttal && reviews.length > 0) {
            for (const agent of this.agents) {
                const myHypothesis = hypotheses.find(h => h.agent === agent.domain);
                if (!myHypothesis) continue;
                const reviewsOnMe = reviews.filter(r => r.target === agent.domain);
                if (reviewsOnMe.length === 0) continue;
                console.log(`... ${agent.name} responding to reviewers...`);
                const content = await agent.rebut(myHypothesis, reviewsOnMe, query, projectContext);
                rebuttals.push({ agent: agent.domain, content });
                await this.recordExperimentEvent?.({
                    kind: 'science_rebuttal',
                    agent: agent.domain,
                    query,
                    content
                });
            }
        }

        console.log(`\n--- Phase 3: Final Synthesis ---`);
        const synthesis = await this.synthesize(query, projectContext, hypotheses, reviews, rebuttals);
        const recommendedActions = parseRecommendedActions(synthesis);
        await this.recordExperimentEvent?.({ kind: 'science_synthesis', query, synthesis, recommendedActions });
        return { query, projectContext, modelName, hypotheses, reviews, rebuttals, synthesis, recommendedActions };
    }

    private async synthesize(
        query: string,
        projectContext: string,
        hypotheses: AgentResponse[],
        reviews: { reviewer: string; target: string; critique: string }[],
        rebuttals: { agent: string; content: string }[]
    ): Promise<string> {
        const context = `Query: "${query}"

Project Context:
${projectContext}

Initial Hypotheses:
${hypotheses.map(h => `- ${h.agent}: ${h.content}`).join('\n')}

Peer Reviews:
${reviews.map(r => `- ${r.reviewer} review of ${r.target}: ${r.critique}`).join('\n')}

Rebuttals (authors' responses to reviews):
${rebuttals.map(r => `- ${r.agent}: ${r.content}`).join('\n')}
`;

        const prompt = `
        You are the Chief Scientist for the Aetherius simulation project.
        Synthesize the above into an implementation-oriented report.
        Do not write generic science. Every suggestion must map to measurable variables we can log each tick.

        Format:
        ### Summary
        [1 short paragraph]

        ### Recommended Actions
        One command per line, exactly as in Available divine actions (e.g. advance_tick 10, change_environment temp 25, bless all). No bullets, no extra text.

        ### Decisions
        - [bullets]

        ### Telemetry To Add
        - [bullets]

        ### Next Experiments
        - [bullets]
        `;

        return await this.control.generateResponse(`${context}\n\n${prompt}`, "You are a scientific orchestrator for a simulation codebase.");
    }
}

/** Extract recommended action commands from synthesis "### Recommended Actions" block (until next ### or EOF). */
export function parseRecommendedActions(synthesis: string): string[] {
    const marker = '### Recommended Actions';
    const idx = synthesis.indexOf(marker);
    if (idx < 0) return [];
    const start = idx + marker.length;
    const rest = synthesis.slice(start);
    const nextH3 = rest.match(/\n### /);
    const block = nextH3 ? rest.slice(0, nextH3.index) : rest;
    return block
        .split('\n')
        .map((line) => line.trim().replace(/^-\s*/, ''))
        .filter((line) => line.length > 0 && !line.startsWith('#'));
}
