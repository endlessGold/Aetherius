import { LLMService } from '../llmService.js';

export interface AgentResponse {
    agent: string;
    content: string;
}

export abstract class ScientistAgent {
    protected llm: LLMService;
    public name: string;
    public domain: string;

    constructor(name: string, domain: string, llm: LLMService) {
        this.name = name;
        this.domain = domain;
        this.llm = llm;
    }

    protected abstract getSystemPrompt(): string;

    async analyze(query: string, projectContext?: string): Promise<string> {
        const prompt = `
        You are a ${this.domain} scientist helping design and debug the Aetherius simulation.
        Use the provided project context as ground truth. If information is missing, say what telemetry is needed.
        Produce actionable guidance, not generic science.

        Project Context:
        ${projectContext || '(none)'}

        Query: "${query}"

        Output:
        - Diagnosis / hypothesis (bullets)
        - Proposed changes (bullets)
        - What to log next tick (bullets)
        `;
        return await this.llm.generateResponse(prompt, this.getSystemPrompt());
    }

    async review(peerResponse: AgentResponse, query: string, projectContext?: string): Promise<string> {
        const prompt = `
        You are a ${this.domain} scientist in a peer review panel for the Aetherius simulation.
        Use the project context. Flag advice that is not implementable in this codebase.

        Project Context:
        ${projectContext || '(none)'}

        Peer Hypothesis: "${peerResponse.content}"

        Critique it from your perspective, focusing on correctness and implementability.
        Output 3-5 bullet points.
        `;
        return await this.llm.generateResponse(prompt, this.getSystemPrompt());
    }

    /** 검토들에 대한 반론/수정 의견 (Phase 2.5 협업 상호작용) */
    async rebut(
        myHypothesis: AgentResponse,
        reviewsOnMe: { reviewer: string; critique: string }[],
        query: string,
        projectContext?: string
    ): Promise<string> {
        const prompt = `
        You are a ${this.domain} scientist. You previously gave this hypothesis for the Aetherius simulation:

        "${myHypothesis.content}"

        Your peers reviewed it:
        ${reviewsOnMe.map((r) => `- ${r.reviewer}: ${r.critique}`).join('\n')}

        Project Context:
        ${projectContext || '(none)'}

        Query: "${query}"

        In 2-4 bullet points: respond to the reviews. Accept valid points and suggest a brief revision or clarification; push back only where you disagree. Keep it short and implementation-oriented.
        `;
        return await this.llm.generateResponse(prompt, this.getSystemPrompt());
    }
}

export class NetworkScienceAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Watts', 'Network Science', llm);
    }

    protected getSystemPrompt(): string {
        return "You are a network science researcher. You model movement trails as weighted graphs with reinforcement and decay. You propose scalable algorithms, avoid O(N^2), and care about emergent structure.";
    }
}

export class EcologyAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Odum', 'Ecology', llm);
    }

    protected getSystemPrompt(): string {
        return "You are an ecologist. You think in terms of trophic flows, resource limitation, carrying capacity, and stability. You propose mechanics that create interesting but robust equilibria.";
    }
}

export class EvolutionAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Fisher', 'Evolution', llm);
    }

    protected getSystemPrompt(): string {
        return "You are an evolutionary biologist and geneticist. You reason about selection pressure, fitness landscapes, and heritable traits. You propose measurable fitness metrics and mutation/selection operators.";
    }
}

export class ClimateHydrologyAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Lorenz', 'Climate & Hydrology', llm);
    }

    protected getSystemPrompt(): string {
        return "You are a climate and hydrology scientist. You focus on temperature, moisture, wildfire/flood regimes, and seasonal forcing. You propose simple stable models that map well to grid layers.";
    }
}

export class GeologistAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Lyell', 'Geology', llm);
    }

    protected getSystemPrompt(): string {
        return "You are a geologist. You study the physical structure of the world, terrain formation, and spatial layout. You can create new places and modify the terrain (elevation, rock type). You think in terms of plate tectonics, erosion, and distinct biomes. You have the authority to create new places and modify the map.";
    }
}

/** 생명 과학자: 종 다양성 연구, 뚜렷한 종 발견 시 네이밍, 지속 관찰, 필요 시 새 진화종 설계·개입 */
export class LifeScienceAgent extends ScientistAgent {
    constructor(llm: LLMService) {
        super('Dr. Linnaeus', 'Life Science', llm);
    }

    protected getSystemPrompt(): string {
        return "You are a life scientist and taxonomist. You study biodiversity, identify distinct species, give them scientific or common names, and observe populations over time. When needed you recommend introducing new evolved forms into the simulation. You think in terms of traits, fitness, and classification.";
    }

    /** 엔티티 요약을 받아 특징이 뚜렷한 종에 대해 네이밍 제안. 한 줄당 entityId | suggestedName | reason 형식 또는 JSON 배열 반환. */
    async suggestSpeciesNames(entitiesSummary: string): Promise<{ entityId: string; suggestedName: string; reason: string }[]> {
        const prompt = `
You are a life scientist. Below is a list of entities in the simulation with their taxonomy (speciesId, kingdom, clade, etc.).
Identify any that are distinctly notable (e.g. hybrid, new lineage, unusual traits) and give each a scientific or common name.

Entities:
${entitiesSummary}

Output format: one line per discovery, exactly: entityId | suggestedName | reason
If nothing is notably distinct, output only: none
`;
        const raw = await this.llm.generateResponse(prompt, this.getSystemPrompt());
        const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && l.toLowerCase() !== 'none');
        const out: { entityId: string; suggestedName: string; reason: string }[] = [];
        for (const line of lines) {
            const parts = line.split('|').map((p) => p.trim());
            if (parts.length >= 3) out.push({ entityId: parts[0], suggestedName: parts[1], reason: parts.slice(2).join(' | ') });
        }
        return out;
    }

    /** 현재 생명 다양성 관찰 요약 생성 (지속 관찰용) */
    async observeDiversity(entitiesSummary: string): Promise<string> {
        const prompt = `
You are a life scientist conducting a biodiversity observation. Summarize the current state of life in the simulation in 1 short paragraph: dominant groups, notable species, trends. Be concise.

Entities summary:
${entitiesSummary}
`;
        return await this.llm.generateResponse(prompt, this.getSystemPrompt());
    }
}
