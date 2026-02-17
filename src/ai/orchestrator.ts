import { LLMService, createDefaultLLMService } from './llmService.js';
import { ScientistAgent, NetworkScienceAgent, EcologyAgent, EvolutionAgent, ClimateHydrologyAgent, AgentResponse } from './agents/scientistAgents.js';

export interface ScienceReport {
    query: string;
    projectContext: string;
    hypotheses: AgentResponse[];
    reviews: { reviewer: string; target: string; critique: string }[];
    synthesis: string;
}

/** 실험 단계별 DB 기록용 페이로드 (이벤트 발생 시 저장) */
export type ExperimentEventPayload =
    | { kind: 'science_hypothesis'; agent: string; name: string; query: string; content: string }
    | { kind: 'science_review'; reviewer: string; target: string; query: string; critique: string }
    | { kind: 'science_synthesis'; query: string; synthesis: string };

export interface ScienceOrchestratorOptions {
    /** 각 에이전트 활동(가설/동료검토/합성) 시 호출. 이벤트를 DB에 기록하려면 전달 */
    recordExperimentEvent?: (payload: ExperimentEventPayload) => Promise<void>;
}

export class ScienceOrchestrator {
    private agents: ScientistAgent[];
    private llm: LLMService;
    private recordExperimentEvent?: (payload: ExperimentEventPayload) => Promise<void>;

    constructor(options?: ScienceOrchestratorOptions) {
        this.llm = createDefaultLLMService();
        this.recordExperimentEvent = options?.recordExperimentEvent;
        this.agents = [
            new NetworkScienceAgent(this.llm),
            new EcologyAgent(this.llm),
            new EvolutionAgent(this.llm),
            new ClimateHydrologyAgent(this.llm)
        ];
    }

    async processQuery(query: string, projectContext: string): Promise<ScienceReport> {
        console.log(`\n🧪 [Science] Orchestrating query: "${query}"`);

        // Phase 1: Individual Analysis — 에이전트별 가설 → 이벤트 기록
        const hypotheses: AgentResponse[] = [];
        console.log(`\n--- Phase 1: Individual Analysis ---`);

        await Promise.all(this.agents.map(async (agent) => {
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
        }));

        // Phase 2: Peer Review — 동료검토마다 이벤트 기록
        console.log(`\n--- Phase 2: Peer Review ---`);
        const reviews: { reviewer: string; target: string; critique: string }[] = [];

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

        // Phase 3: Synthesis — 합성 결과 이벤트 기록
        console.log(`\n--- Phase 3: Final Synthesis ---`);
        const synthesis = await this.synthesize(query, projectContext, hypotheses, reviews);
        await this.recordExperimentEvent?.({ kind: 'science_synthesis', query, synthesis });
        return { query, projectContext, hypotheses, reviews, synthesis };
    }

    private async synthesize(
        query: string,
        projectContext: string,
        hypotheses: AgentResponse[],
        reviews: { reviewer: string; target: string; critique: string }[]
    ): Promise<string> {
        const context = `Query: "${query}"

Project Context:
${projectContext}

Initial Hypotheses:
${hypotheses.map(h => `- ${h.agent}: ${h.content}`).join('\n')}

Peer Reviews:
${reviews.map(r => `- ${r.reviewer} review of ${r.target}: ${r.critique}`).join('\n')}
`;

        const prompt = `
        You are the Chief Scientist for the Aetherius simulation project.
        Synthesize the above into an implementation-oriented report.
        Do not write generic science. Every suggestion must map to measurable variables we can log each tick.

        Format:
        ### Summary
        [1 short paragraph]

        ### Decisions
        - [bullets]

        ### Telemetry To Add
        - [bullets]

        ### Next Experiments
        - [bullets]
        `;

        return await this.llm.generateResponse(`${context}\n\n${prompt}`, "You are a scientific orchestrator for a simulation codebase.");
    }
}
